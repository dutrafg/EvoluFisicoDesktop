using System;
using System.IO;
using Microsoft.Data.Sqlite;

namespace EvoluFisico.Desktop;

/// <summary>
/// Encrypted, transactional native storage. Activation and legacy migration
/// must be performed separately after validating all existing data sources.
/// </summary>
internal sealed class EncryptedSqliteStore
{
    private readonly string _path;

    internal EncryptedSqliteStore(string? path = null)
    {
        _path = path ?? Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "EvoluFisicoDesktop", "Data", "records.sqlite");
        Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(_path))!);
    }

    private SqliteConnection Open()
    {
        var builder = new SqliteConnectionStringBuilder
        {
            DataSource = _path,
            Mode = SqliteOpenMode.ReadWriteCreate,
            Pooling = false
        };
        var db = new SqliteConnection(builder.ToString());
        db.Open();
        using var setup = db.CreateCommand();
        setup.CommandText = """
            PRAGMA busy_timeout=5000;
            PRAGMA foreign_keys=ON;
            """;
        setup.ExecuteNonQuery();
        using var version = db.CreateCommand();
        version.CommandText = "PRAGMA user_version";
        var schemaVersion = Convert.ToInt32(version.ExecuteScalar());
        if (schemaVersion > 1)
        {
            db.Dispose();
            throw new InvalidDataException("Banco criado por uma versão mais recente do EvoluFisico. Atualize o aplicativo antes de abrir.");
        }
        using var schema = db.CreateCommand();
        schema.CommandText = """
            PRAGMA journal_mode=WAL;
            CREATE TABLE IF NOT EXISTS protected_records (
              record_id TEXT PRIMARY KEY NOT NULL,
              encrypted_payload BLOB NOT NULL,
              updated_utc TEXT NOT NULL
            );
            """;
        schema.ExecuteNonQuery();
        if (schemaVersion == 0)
        {
            using var initialize = db.CreateCommand();
            initialize.CommandText = "PRAGMA user_version=1";
            initialize.ExecuteNonQuery();
        }
        return db;
    }

    internal void Save(string recordId, byte[] plaintext, string? masterPassword = null)
    {
        if (string.IsNullOrWhiteSpace(recordId) || recordId.Length > 128)
            throw new ArgumentException("Identificador inválido.", nameof(recordId));
        ArgumentNullException.ThrowIfNull(plaintext);
        var encrypted = ProtectedVault.Encrypt(plaintext, masterPassword);
        using var db = Open();
        using var tx = db.BeginTransaction();
        using var cmd = db.CreateCommand();
        cmd.Transaction = tx;
        cmd.CommandText = """
            INSERT INTO protected_records(record_id, encrypted_payload, updated_utc)
            VALUES ($id, $data, $time)
            ON CONFLICT(record_id) DO UPDATE SET
              encrypted_payload=excluded.encrypted_payload,
              updated_utc=excluded.updated_utc
            """;
        cmd.Parameters.AddWithValue("$id", recordId);
        cmd.Parameters.AddWithValue("$data", encrypted);
        cmd.Parameters.AddWithValue("$time", DateTimeOffset.UtcNow.ToString("O"));
        cmd.ExecuteNonQuery();
        tx.Commit();
    }

    internal byte[]? Load(string recordId, string? masterPassword = null)
    {
        using var db = Open();
        using var cmd = db.CreateCommand();
        cmd.CommandText = "SELECT encrypted_payload FROM protected_records WHERE record_id=$id";
        cmd.Parameters.AddWithValue("$id", recordId);
        var result = cmd.ExecuteScalar();
        return result is byte[] bytes ? ProtectedVault.Decrypt(bytes, masterPassword) : null;
    }

    /// <summary>Imports a verified snapshot atomically. Existing records remain intact on failure.</summary>
    internal void ImportBatch(System.Collections.Generic.IReadOnlyDictionary<string, byte[]> records, string? masterPassword = null)
    {
        ArgumentNullException.ThrowIfNull(records);
        if (records.Count == 0) return;
        var encrypted = new System.Collections.Generic.Dictionary<string, byte[]>(StringComparer.Ordinal);
        foreach (var pair in records)
        {
            if (string.IsNullOrWhiteSpace(pair.Key) || pair.Key.Length > 128)
                throw new ArgumentException("Identificador inválido na importação.");
            ArgumentNullException.ThrowIfNull(pair.Value);
            encrypted.Add(pair.Key, ProtectedVault.Encrypt(pair.Value, masterPassword));
        }
        using var db = Open();
        using var tx = db.BeginTransaction();
        foreach (var pair in encrypted)
        {
            using var cmd = db.CreateCommand();
            cmd.Transaction = tx;
            cmd.CommandText = """
                INSERT INTO protected_records(record_id, encrypted_payload, updated_utc)
                VALUES ($id, $data, $time)
                ON CONFLICT(record_id) DO NOTHING
                """;
            cmd.Parameters.AddWithValue("$id", pair.Key);
            cmd.Parameters.AddWithValue("$data", pair.Value);
            cmd.Parameters.AddWithValue("$time", DateTimeOffset.UtcNow.ToString("O"));
            if (cmd.ExecuteNonQuery() != 1)
                throw new InvalidDataException("A importação encontrou um identificador já existente. Nenhum registro foi substituído.");
            using var check = db.CreateCommand();
            check.Transaction = tx;
            check.CommandText = "SELECT encrypted_payload FROM protected_records WHERE record_id=$id";
            check.Parameters.AddWithValue("$id", pair.Key);
            var encryptedSaved = check.ExecuteScalar() as byte[];
            if (encryptedSaved is null)
                throw new InvalidDataException("Falha ao conferir o registro importado.");
            var restored = ProtectedVault.Decrypt(encryptedSaved, masterPassword);
            if (!System.Security.Cryptography.CryptographicOperations.FixedTimeEquals(restored, records[pair.Key]))
                throw new InvalidDataException("Falha na conferência da importação criptografada.");
        }
        tx.Commit();
    }

    /// <summary>Deletes a protected record in a transaction. Does not imply secure disk erasure.</summary>
    internal bool Delete(string recordId)
    {
        if (string.IsNullOrWhiteSpace(recordId) || recordId.Length > 128)
            throw new ArgumentException("Identificador inválido.", nameof(recordId));
        using var db = Open();
        using var tx = db.BeginTransaction();
        using var cmd = db.CreateCommand();
        cmd.Transaction = tx;
        cmd.CommandText = "DELETE FROM protected_records WHERE record_id=$id";
        cmd.Parameters.AddWithValue("$id", recordId);
        var deleted = cmd.ExecuteNonQuery() > 0;
        tx.Commit();
        return deleted;
    }

    /// <summary>Lists opaque record identifiers without exposing encrypted patient payloads.</summary>
    internal string[] ListRecordIds()
    {
        using var db = Open();
        using var cmd = db.CreateCommand();
        cmd.CommandText = "SELECT record_id FROM protected_records ORDER BY record_id";
        using var reader = cmd.ExecuteReader();
        var ids = new System.Collections.Generic.List<string>();
        while (reader.Read()) ids.Add(reader.GetString(0));
        return ids.ToArray();
    }

    /// <summary>Creates a consistent SQLite snapshot without exposing decrypted patient data.</summary>
    internal void BackupTo(string destination, string? masterPassword = null)
    {
        if (string.IsNullOrWhiteSpace(destination))
            throw new ArgumentException("Caminho de backup inválido.", nameof(destination));
        var fullSource = Path.GetFullPath(_path);
        var fullDestination = Path.GetFullPath(destination);
        if (string.Equals(fullSource, fullDestination, StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("O backup não pode substituir o banco ativo.", nameof(destination));
        Directory.CreateDirectory(Path.GetDirectoryName(fullDestination)!);
        var temporary = fullDestination + "." + Guid.NewGuid().ToString("N") + ".tmp";
        try
        {
            using (var source = Open())
            {
                using var backup = new SqliteConnection(new SqliteConnectionStringBuilder
                {
                    DataSource = temporary, Mode = SqliteOpenMode.ReadWriteCreate, Pooling = false
                }.ToString());
                backup.Open();
                source.BackupDatabase(backup);
            }
            using (var verification = new SqliteConnection(new SqliteConnectionStringBuilder
            {
                DataSource = temporary, Mode = SqliteOpenMode.ReadOnly, Pooling = false
            }.ToString()))
            {
                verification.Open();
                using var check = verification.CreateCommand();
                check.CommandText = "PRAGMA integrity_check";
                if (!string.Equals(check.ExecuteScalar() as string, "ok", StringComparison.OrdinalIgnoreCase))
                    throw new InvalidDataException("Backup SQLite não passou na verificação de integridade.");
            }
            // A structurally valid SQLite snapshot may still contain damaged ciphertext.
            // Authenticate every copied record before publishing the backup.
            new EncryptedSqliteStore(temporary).VerifyEncryptedRecords(masterPassword);
            File.Move(temporary, fullDestination, true);
        }
        finally
        {
            if (File.Exists(temporary)) File.Delete(temporary);
        }
    }

    /// <summary>
    /// Verifies both SQLite structural integrity and authentication tags for all
    /// DPAPI-protected records. Password-protected records require an explicit password.
    /// </summary>
    internal void VerifyEncryptedRecords(string? masterPassword = null)
    {
        using var db = Open();
        using (var check = db.CreateCommand())
        {
            check.CommandText = "PRAGMA integrity_check";
            if (!string.Equals(check.ExecuteScalar() as string, "ok", StringComparison.OrdinalIgnoreCase))
                throw new InvalidDataException("Falha na integridade estrutural do banco.");
        }
        using var command = db.CreateCommand();
        command.CommandText = "SELECT record_id, encrypted_payload FROM protected_records";
        using var reader = command.ExecuteReader();
        while (reader.Read())
        {
            var recordId = reader.GetString(0);
            var payload = reader.GetFieldValue<byte[]>(1);
            try
            {
                _ = ProtectedVault.Decrypt(payload, masterPassword);
            }
            catch (Exception ex) when (ex is System.Security.Cryptography.CryptographicException
                or InvalidDataException or System.Text.Json.JsonException)
            {
                throw new InvalidDataException("Registro criptografado inválido: " + recordId, ex);
            }
        }
    }

    internal bool VerifyIntegrity()
    {
        using var db = Open();
        using var cmd = db.CreateCommand();
        cmd.CommandText = "PRAGMA integrity_check";
        return string.Equals(cmd.ExecuteScalar() as string, "ok", StringComparison.OrdinalIgnoreCase);
    }
}
