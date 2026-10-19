using System;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using EvoluFisico.Desktop;

static void Check(bool ok, string description)
{
    if (!ok) throw new Exception("FAIL: " + description);
    Console.WriteLine("PASS: " + description);
}
static void Reject(Action action, string description)
{
    try { action(); } catch (Exception ex) when (ex is CryptographicException or InvalidDataException) { Console.WriteLine("PASS: " + description); return; }
    throw new Exception("FAIL: " + description);
}
var sample = Encoding.UTF8.GetBytes("{\"patient\":\"Paciente fictício\",\"measure\":42}");
var automatic = ProtectedVault.Encrypt(sample);
Check(sample.SequenceEqual(ProtectedVault.Decrypt(automatic)), "Windows DPAPI encryption round trip");
Check(!Encoding.UTF8.GetString(automatic).Contains("Paciente fictício"), "No plaintext in encrypted envelope");
var password = "uma-senha-mestre-de-teste-longa";
var secured = ProtectedVault.Encrypt(sample, password);
Check(sample.SequenceEqual(ProtectedVault.Decrypt(secured, password)), "Master password encryption round trip");
Reject(() => ProtectedVault.Decrypt(secured, "senha-incorreta"), "Wrong password rejected");
var damaged = (byte[])secured.Clone();
var text = Encoding.UTF8.GetString(damaged).Replace("master-password", "windows-dpapi");
Reject(() => ProtectedVault.Decrypt(Encoding.UTF8.GetBytes(text), password), "Tampered metadata rejected");
var dir = Path.Combine(Path.GetTempPath(), "EvoluFisicoStorageTest-" + Guid.NewGuid().ToString("N"));
Directory.CreateDirectory(dir);
try
{
    var store = new EncryptedSqliteStore(Path.Combine(dir, "test.sqlite"));
    Check(store.VerifyIntegrity(), "New SQLite database integrity");
    store.Save("patient-001", sample);
    Check(sample.SequenceEqual(store.Load("patient-001")!), "SQLite encrypted record round trip");
    store.Save("patient-001", Encoding.UTF8.GetBytes("updated"));
    Check(Encoding.UTF8.GetString(store.Load("patient-001")!) == "updated", "SQLite transaction upsert");
    store.Save("patient-002", sample, password);
    Check(sample.SequenceEqual(store.Load("patient-002", password)!), "SQLite password protected record");
    Reject(() => store.Load("patient-002", "wrong-password"), "SQLite rejects wrong password");
    Check(store.Load("not-found") is null, "Missing record returns null");
    Check(store.VerifyIntegrity(), "SQLite integrity after writes");
}
finally { Directory.Delete(dir, true); }
Console.WriteLine("Encrypted SQLite smoke tests completed.");
