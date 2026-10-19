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
            PRAGMA journal_mode=WAL;
            CREATE TABLE IF NOT EXISTS protected_records (
              record_id TEXT PRIMARY KEY NOT NULL,
              encrypted_payload BLOB NOT NULL,
              updated_utc TEXT NOT NULL
            );
            PRAGMA user_version=1;
            """;
        setup.ExecuteNonQuery();
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

    internal bool VerifyIntegrity()
    {
        using var db = Open();
        using var cmd = db.CreateCommand();
        cmd.CommandText = "PRAGMA integrity_check";
        return string.Equals(cmd.ExecuteScalar() as string, "ok", StringComparison.OrdinalIgnoreCase);
    }
}
