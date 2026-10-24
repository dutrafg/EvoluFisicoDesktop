using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Security.Cryptography;
using System.Threading;
using System.Threading.Tasks;

namespace EvoluFisico.Desktop;

/// <summary>
/// Pinned local model catalog: user selects and downloads only known model packages.
/// No telemetry and no student records are transmitted to download endpoints.
/// Models are stored in LocalAppData, separate from app upgrades and encrypted SQLite.
/// </summary>
internal static class EfiAiModelManager
{
    internal sealed record ModelSpec(
        string Id, string Label, string Filename, string Sha256, long SizeBytes,
        string DownloadUrl, int RecommendedRamGb);

    private static readonly ModelSpec[] Catalog =
    {
        new("qwen35-08b-q4", "Qwen3.5-0.8B · Q4_0",
            "Qwen3.5-0.8B-Q4_0.gguf",
            "57d1997790d1744fba5b40a7317df71ea5e2acee28c47e78f0cce39c0703f8cf",
            563_000_000,
            "https://huggingface.co/ggml-org/Qwen3.5-0.8B-GGUF/resolve/main/Qwen3.5-0.8B-Q4_0.gguf", 8),
        new("qwen35-2b-q4", "Qwen3.5-2B · Q4_K_M",
            "Qwen3.5-2B-Q4_K_M.gguf",
            "a8b50de00b780c0f3c16f07cb041a1ecd678b6e22fd8cde91e57fe4b5031523b",
            1_310_000_000,
            "https://huggingface.co/SoAIHQ/Qwen3.5-2B-GGUF/resolve/main/Qwen3.5-2B-Q4_K_M.gguf", 8),
        new("qwen35-4b-q4", "Qwen3.5-4B · Q4_K_M",
            "Qwen3.5-4B-Q4_K_M.gguf",
            "2ebe6eb67cb92adeffc7073c48dd4e3baf79465ac650793dc751cad2b29cf219",
            2_780_000_000,
            "https://huggingface.co/SoAIHQ/Qwen3.5-4B-GGUF/resolve/main/Qwen3.5-4B-Q4_K_M.gguf", 12),
        new("qwen35-9b-q4", "Qwen3.5-9B · Q4_K_M",
            "Qwen3.5-9B-Q4_K_M.gguf",
            "ef6f244d63abcba4f8d30b7cbd9369e9e798fc33cf21109889373f59af329c93",
            5_780_000_000,
            "https://huggingface.co/SoAIHQ/Qwen3.5-9B-GGUF/resolve/main/Qwen3.5-9B-Q4_K_M.gguf", 24)
    };

    internal const string DefaultModelId = "qwen35-2b-q4";
    internal static IReadOnlyList<ModelSpec> Models => Catalog;
    internal static readonly string ModelDirectory = EfiAppPaths.ModelDirectory;
    internal static string RuntimePath => Path.Combine(
        AppContext.BaseDirectory, "ai-runtime", "llama-server.exe");
    private static string PreferencePath => Path.Combine(ModelDirectory, "selected-model.txt");
    private static readonly SemaphoreSlim InstallationLock = new(1, 1);
    private static readonly HttpClient Client = new() { Timeout = Timeout.InfiniteTimeSpan };

    internal static ModelSpec Get(string? id) =>
        Catalog.FirstOrDefault(m => m.Id == id)
        ?? throw new ArgumentException("Modelo de IA fora do catálogo permitido.");

    internal static string SelectedId
    {
        get
        {
            try
            {
                var id = File.ReadAllText(PreferencePath).Trim();
                if (Catalog.Any(m => m.Id == id)) return id;
            }
            catch (IOException) { }
            catch (UnauthorizedAccessException) { }
            return DefaultModelId;
        }
    }

    internal static string ModelPath(ModelSpec model) =>
        Path.Combine(ModelDirectory, model.Filename);

    internal static async Task<bool> IsValidAsync(string id,
        CancellationToken cancellationToken = default)
    {
        var model = Get(id);
        var path = ModelPath(model);
        if (!File.Exists(path)) return false;
        try
        {
            await using var file = new FileStream(path, FileMode.Open, FileAccess.Read,
                FileShare.Read, 1024 * 1024,
                FileOptions.SequentialScan | FileOptions.Asynchronous);
            // Reported decimal sizes are rounded; reject obviously wrong payloads.
            if (file.Length < model.SizeBytes * 9 / 10 ||
                file.Length > model.SizeBytes * 11 / 10) return false;
            var hash = await SHA256.HashDataAsync(file, cancellationToken);
            return string.Equals(Convert.ToHexString(hash), model.Sha256,
                StringComparison.OrdinalIgnoreCase);
        }
        catch (IOException) { return false; }
        catch (UnauthorizedAccessException) { return false; }
    }

    internal static async Task SetSelectedAsync(string id,
        CancellationToken cancellationToken = default)
    {
        Get(id);
        if (!await IsValidAsync(id, cancellationToken))
            throw new InvalidOperationException("Instale e verifique o modelo antes de selecioná-lo.");
        Directory.CreateDirectory(ModelDirectory);
        var tmp = PreferencePath + ".tmp";
        try
        {
            await File.WriteAllTextAsync(tmp, id, cancellationToken);
            File.Move(tmp, PreferencePath, overwrite: true);
        }
        finally { if (File.Exists(tmp)) File.Delete(tmp); }
    }

    internal static async Task<bool> InstallAsync(string id,
        CancellationToken cancellationToken = default)
    {
        var model = Get(id);
        await InstallationLock.WaitAsync(cancellationToken);
        try
        {
            if (await IsValidAsync(id, cancellationToken)) return true;
            Directory.CreateDirectory(ModelDirectory);
            var drive = new DriveInfo(Path.GetPathRoot(ModelDirectory)!);
            if (drive.AvailableFreeSpace < model.SizeBytes * 2 + 1_000_000_000)
                throw new IOException("Espaço livre insuficiente para baixar e verificar o modelo.");
            var destination = ModelPath(model);
            var partial = destination + ".partial";
            try
            {
                if (File.Exists(partial)) File.Delete(partial);
                using var request = new HttpRequestMessage(HttpMethod.Get, model.DownloadUrl);
                using var response = await Client.SendAsync(request,
                    HttpCompletionOption.ResponseHeadersRead, cancellationToken);
                response.EnsureSuccessStatusCode();
                if (response.Content.Headers.ContentLength is long expected
                    && (expected < model.SizeBytes * 9 / 10 ||
                        expected > model.SizeBytes * 11 / 10))
                    throw new InvalidDataException("O download possui tamanho inesperado.");
                await using (var output = new FileStream(partial, FileMode.CreateNew,
                    FileAccess.Write, FileShare.None, 1024 * 1024,
                    FileOptions.Asynchronous | FileOptions.SequentialScan))
                await using (var input = await response.Content.ReadAsStreamAsync(cancellationToken))
                {
                    var buffer = new byte[1024 * 1024];
                    long total = 0;
                    int bytes;
                    while ((bytes = await input.ReadAsync(buffer, cancellationToken)) != 0)
                    {
                        total += bytes;
                        if (total > model.SizeBytes * 11 / 10)
                            throw new InvalidDataException("O arquivo excede o tamanho esperado.");
                        await output.WriteAsync(buffer.AsMemory(0, bytes), cancellationToken);
                    }
                    if (total < model.SizeBytes * 9 / 10)
                        throw new InvalidDataException("Download incompleto.");
                    await output.FlushAsync(cancellationToken);
                }
                await using (var downloaded = new FileStream(partial, FileMode.Open,
                    FileAccess.Read, FileShare.Read, 1024 * 1024, FileOptions.Asynchronous))
                {
                    var hash = await SHA256.HashDataAsync(downloaded, cancellationToken);
                    if (!string.Equals(Convert.ToHexString(hash), model.Sha256,
                        StringComparison.OrdinalIgnoreCase))
                        throw new InvalidDataException("O download falhou na verificação SHA-256.");
                }
                File.Move(partial, destination, overwrite: true);
                return true;
            }
            finally { if (File.Exists(partial)) File.Delete(partial); }
        }
        finally { InstallationLock.Release(); }
    }

    internal static async Task RemoveAsync(string id,
        CancellationToken cancellationToken = default)
    {
        var model = Get(id);
        await InstallationLock.WaitAsync(cancellationToken);
        try
        {
            var path = ModelPath(model);
            if (File.Exists(path)) File.Delete(path);
            if (SelectedId == id && id != DefaultModelId)
            {
                Directory.CreateDirectory(ModelDirectory);
                await File.WriteAllTextAsync(PreferencePath, DefaultModelId, cancellationToken);
            }
        }
        finally { InstallationLock.Release(); }
    }
}
