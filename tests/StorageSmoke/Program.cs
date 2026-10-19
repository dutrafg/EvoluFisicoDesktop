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
    var batch = new System.Collections.Generic.Dictionary<string, byte[]> { ["batch-a"] = sample, ["batch-b"] = Encoding.UTF8.GetBytes("fictitious record") };
    store.ImportBatch(batch);
    Check(batch.All(item => item.Value.SequenceEqual(store.Load(item.Key)!)), "Transactional encrypted batch migration");
    try
    {
        store.ImportBatch(new System.Collections.Generic.Dictionary<string, byte[]>
        {
            ["new-before-collision"] = sample,
            ["patient-001"] = Encoding.UTF8.GetBytes("must not overwrite")
        });
        throw new Exception("Conflicting batch should fail");
    }
    catch (InvalidDataException) { Console.WriteLine("PASS: Duplicate identifier blocks migration"); }
    Check(store.Load("new-before-collision") is null, "Conflicting migration rolls back earlier inserts");
    Check(Encoding.UTF8.GetString(store.Load("patient-001")!) == "updated", "Existing patient record remains unchanged");

    try { store.ImportBatch(new System.Collections.Generic.Dictionary<string, byte[]> { ["valid"] = sample, [""] = sample }); throw new Exception("Invalid batch should fail"); }
    catch (ArgumentException) { Console.WriteLine("PASS: Invalid batch rejected"); }
    Check(store.Load("valid") is null, "Failed batch leaves database unchanged");
    Check(store.ListRecordIds().Contains("batch-a"), "Protected record listing");
    Check(store.Delete("batch-a"), "Protected record deletion");
    Check(store.Load("batch-a") is null, "Deleted record is no longer readable");
    Check(!store.Delete("batch-a"), "Repeated deletion is idempotent");
    Check(!store.ListRecordIds().Contains("batch-a"), "Deleted record absent from listing");
    var futureDatabase = Path.Combine(dir, "future.sqlite");
    using (var future = new Microsoft.Data.Sqlite.SqliteConnection("Data Source=" + futureDatabase + ";Pooling=False"))
    {
        future.Open();
        using var setVersion = future.CreateCommand();
        setVersion.CommandText = "PRAGMA user_version=99";
        setVersion.ExecuteNonQuery();
    }
    try { new EncryptedSqliteStore(futureDatabase).VerifyIntegrity(); throw new Exception("Future schema must be rejected"); }
    catch (InvalidDataException) { Console.WriteLine("PASS: Newer SQLite schema rejected without downgrade"); }
    using (var future = new Microsoft.Data.Sqlite.SqliteConnection("Data Source=" + futureDatabase + ";Pooling=False"))
    {
        future.Open();
        using var checkVersion = future.CreateCommand();
        checkVersion.CommandText = "PRAGMA user_version";
        Check(Convert.ToInt32(checkVersion.ExecuteScalar()) == 99, "Newer schema version preserved");
        using var schemaCheck = future.CreateCommand();
        schemaCheck.CommandText = "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='protected_records'";
        Check(Convert.ToInt32(schemaCheck.ExecuteScalar()) == 0, "Incompatible database schema not modified");
    }
    store.VerifyEncryptedRecords(password);
    Console.WriteLine("PASS: All encrypted records authenticated");
    var snapshot = Path.Combine(dir, "snapshot.sqlite");
    store.BackupTo(snapshot, password);
    var restored = new EncryptedSqliteStore(snapshot);
    Check(restored.VerifyIntegrity(), "SQLite snapshot integrity");
    Check(sample.SequenceEqual(restored.Load("patient-002", password)!), "Encrypted record restored from snapshot");
    Check(Encoding.UTF8.GetString(restored.Load("patient-001")!) == "updated", "Latest transactional data preserved in backup");
    store.Save("batch-delete-a", Encoding.UTF8.GetBytes("a"));
    store.Save("batch-delete-b", Encoding.UTF8.GetBytes("b"));
    try {
        store.DeleteBatch(new[] { "batch-delete-a", "missing-record" });
        throw new Exception("Missing record should roll back batch deletion");
    }
    catch (InvalidDataException) {
        Check(store.Load("batch-delete-a") is not null,
            "Batch deletion rolls back all records when an ID is missing");
    }
    try {
        store.DeleteBatch(new[] { "batch-delete-a", "batch-delete-a" });
        throw new Exception("Duplicate IDs should be rejected");
    }
    catch (ArgumentException) {
        Check(store.Load("batch-delete-a") is not null,
            "Duplicate batch identifiers are rejected without deletion");
    }
    store.DeleteBatch(new[] { "batch-delete-a", "batch-delete-b" });
    Check(store.Load("batch-delete-a") is null && store.Load("batch-delete-b") is null,
        "Batch deletion commits all records atomically");
    store.Save("eval-target", Encoding.UTF8.GetBytes("target"));
    store.Save("eval-linked", Encoding.UTF8.GetBytes("before"));
    try {
        store.DeleteEvaluationWithUpdates("eval-target", new System.Collections.Generic.Dictionary<string, byte[]>
        {
            ["eval-linked"] = Encoding.UTF8.GetBytes("after"),
            ["eval-missing"] = Encoding.UTF8.GetBytes("invalid")
        });
        throw new Exception("Missing linked record should abort the transaction");
    }
    catch (InvalidDataException) {
        Check(Encoding.UTF8.GetString(store.Load("eval-linked")!) == "before"
            && store.Load("eval-target") is not null,
            "Evaluation deletion rolls back comparison updates when a linked record is missing");
    }
    store.DeleteEvaluationWithUpdates("eval-target", new System.Collections.Generic.Dictionary<string, byte[]>
    {
        ["eval-linked"] = Encoding.UTF8.GetBytes("after")
    });
    Check(store.Load("eval-target") is null
        && Encoding.UTF8.GetString(store.Load("eval-linked")!) == "after",
        "Evaluation deletion atomically updates comparisons and removes target");
    // A verified backup must be a point-in-time copy, not a live database alias.
    store.Save("patient-001", Encoding.UTF8.GetBytes("post-backup-change"));
    Check(Encoding.UTF8.GetString(store.Load("patient-001")!) == "post-backup-change",
        "Live database accepts writes after backup");
    Check(Encoding.UTF8.GetString(restored.Load("patient-001")!) == "updated",
        "Recovered snapshot is isolated from later writes");
    Check(restored.ListRecordIds().Contains("patient-002"),
        "Recovered snapshot retains all protected record identifiers");
    try { store.BackupTo(Path.Combine(dir, "requires-password.sqlite")); throw new Exception("Password protected records must block unauthenticated backup"); }
    catch (InvalidDataException) { Console.WriteLine("PASS: Missing master password blocks verified backup"); }
    Check(!File.Exists(Path.Combine(dir, "requires-password.sqlite")),
        "Failed authenticated backup does not publish a partial destination");
    using (var tamper = new Microsoft.Data.Sqlite.SqliteConnection("Data Source=" + snapshot + ";Pooling=False"))
    {
        tamper.Open();
        using var command = tamper.CreateCommand();
        command.CommandText = "UPDATE protected_records SET encrypted_payload = X'010203' WHERE record_id='patient-001'";
        Check(command.ExecuteNonQuery() == 1, "Synthetic ciphertext tampering performed");
    }
    Check(restored.VerifyIntegrity(), "SQLite structural check alone cannot detect ciphertext tampering");
    try { restored.VerifyEncryptedRecords(password); throw new Exception("Tampering should fail authentication"); }
    catch (InvalidDataException) { Console.WriteLine("PASS: Authenticated record verification detects tampering"); }

    var protectedBackup = Path.Combine(dir, "authenticated-backup.sqlite");
    File.WriteAllText(protectedBackup, "Previous backup must survive failure");
    try
    {
        restored.BackupTo(protectedBackup, password);
        throw new Exception("Corrupt ciphertext must block backup");
    }
    catch (InvalidDataException) { Console.WriteLine("PASS: Tampered ciphertext blocks backup publication"); }
    Check(File.ReadAllText(protectedBackup) == "Previous backup must survive failure",
        "Existing backup preserved when encrypted snapshot authentication fails");
    try { store.BackupTo(Path.Combine(dir, "test.sqlite")); throw new Exception("Backup must reject source overwrite"); }
    catch (ArgumentException) { Console.WriteLine("PASS: Active database overwrite rejected"); }
}
finally
{
    Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools();
    Directory.Delete(dir, true);
}
Console.WriteLine("Encrypted SQLite smoke tests completed.");
