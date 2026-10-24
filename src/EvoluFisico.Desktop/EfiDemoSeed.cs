using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;

namespace EvoluFisico.Desktop;

/// <summary>
/// One-time synthetic assessment fixture seeding, only inside the isolated EFI Alpha profile.
/// Uses the native encrypted SQLite importer, not WebView2 localStorage.
/// Existing client records and model files are never overwritten.
/// </summary>
internal static class EfiDemoSeed
{
    private const string MarkerId = "efi-demo-fixtures-v1";
    private const string FixtureRelativePath = "wwwroot/assets/efia/efi-demo-students.json";

    internal static int Ensure()
    {
        // Never put test patients into any stable version, even if the DLL is accidentally copied.
        if (!EfiAppPaths.IsAlpha) return 0;
        var store = new EncryptedSqliteStore();
        var known = new HashSet<string>(store.ListRecordIds(), StringComparer.Ordinal);
        if (known.Contains(MarkerId)) return 0;
        var path = Path.Combine(AppContext.BaseDirectory,
            FixtureRelativePath.Replace('/', Path.DirectorySeparatorChar));
        if (!File.Exists(path))
            throw new FileNotFoundException("Pacote de alunos de demonstração ausente.", path);
        using var data = JsonDocument.Parse(File.ReadAllText(path, Encoding.UTF8));
        var root = data.RootElement;
        if (root.GetProperty("version").GetInt32() != 1
            || root.GetProperty("students").GetInt32() != 4
            || root.GetProperty("assessmentsPerStudent").GetInt32() != 4
            || root.GetProperty("intervalDays").GetInt32() != 30)
            throw new InvalidDataException("Metadados dos exemplos não correspondem à especificação EFI.");
        var array = root.GetProperty("records");
        if (array.ValueKind != JsonValueKind.Array || array.GetArrayLength() != 16)
            throw new InvalidDataException("Esperadas exatamente 16 avaliações de demonstração.");

        var byStudent = new Dictionary<string, List<DateTime>>(StringComparer.Ordinal);
        var batch = new Dictionary<string, byte[]>(StringComparer.Ordinal);
        foreach (var element in array.EnumerateArray())
        {
            var id = element.GetProperty("id").GetString() ?? "";
            var subject = element.GetProperty("cliente_id").GetString() ?? "";
            var dateText = element.GetProperty("data_avaliacao").GetString() ?? "";
            var name = element.GetProperty("nome").GetString() ?? "";
            if (!id.StartsWith("efi-demo-", StringComparison.Ordinal)
                || !subject.StartsWith("efi-demo-client-", StringComparison.Ordinal)
                || !name.Contains("DEMONSTRAÇÃO", StringComparison.Ordinal)
                || !DateTime.TryParseExact(dateText, "yyyy-MM-dd",
                    CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
                throw new InvalidDataException("Um dos exemplos possui identidade ou data inválida.");
            if (!byStudent.TryGetValue(subject, out var dates))
                byStudent[subject] = dates = new List<DateTime>();
            dates.Add(date);
            var key = "ef-eval-" + id;
            if (!known.Contains(key))
            {
                if (!batch.TryAdd(key, Encoding.UTF8.GetBytes(element.GetRawText())))
                    throw new InvalidDataException("ID de exemplo duplicado.");
            }
        }
        if (byStudent.Count != 4 || byStudent.Any(x =>
            x.Value.Count != 4 || x.Value.Distinct().Count() != 4
            || x.Value.OrderBy(d => d).Zip(x.Value.OrderBy(d => d).Skip(1),
                (a, b) => (b - a).TotalDays).Any(gap => gap != 30)))
            throw new InvalidDataException("Os quatro alunos precisam ter quatro avaliações a cada 30 dias.");

        // Marker and assessments are one encrypted SQLite transaction.
        batch.Add(MarkerId, Encoding.UTF8.GetBytes("EFI Alpha: exemplos fictícios v1."));
        store.ImportBatch(batch);
        return batch.Count - 1;
    }
}
