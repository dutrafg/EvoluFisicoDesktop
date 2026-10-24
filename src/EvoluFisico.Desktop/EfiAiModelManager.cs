using System;
using System.IO;
using System.Net.Http;
using System.Security.Cryptography;
using System.Threading;
using System.Threading.Tasks;

namespace EvoluFisico.Desktop;

/// <summary>
/// Installs only an explicitly approved, checksum-pinned Qwen model.
/// The model is kept outside Program Files so normal users can install it.
/// No student information or telemetry is sent during the download.
/// </summary>
internal static class EfiAiModelManager
{
    internal const string ModelName = "Qwen3.5-2B Q4_K_M";
    internal const string ModelFileName = "Qwen3.5-2B-Q4_K_M.gguf";
    internal const string Sha256 = "a8b50de00b780c0f3c16f07cb041a1ecd678b6e22fd8cde91e57fe4b5031523b";
    internal static readonly Uri DownloadUri = new(
        "https://huggingface.co/SoAIHQ/Qwen3.5-2B-GGUF/resolve/main/Qwen3.5-2B-Q4_K_M.gguf");
    internal static readonly string ModelDirectory = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "EvoluFisicoDesktop", "EFI", "models");
    internal static string ModelPath => Path.Combine(ModelDirectory, ModelFileName);
    internal static string RuntimePath => Path.Combine(
        AppContext.BaseDirectory, "ai-runtime", "llama-server.exe");
    private static readonly SemaphoreSlim InstallationLock = new(1, 1);
    private static readonly HttpClient Client = new()
    {
        Timeout = Timeout.InfiniteTimeSpan
    };

    internal static async Task<bool> IsValidAsync(CancellationToken cancellationToken = default)
    {
        if (!File.Exists(ModelPath)) return false;
        try
        {
            await using var file = new FileStream(ModelPath, FileMode.Open, FileAccess.Read,
                FileShare.Read, 1024 * 1024, FileOptions.SequentialScan | FileOptions.Asynchronous);
            if (file.Length < 1_000_000_000 || file.Length > 2_500_000_000) return false;
            var hash = await SHA256.HashDataAsync(file, cancellationToken);
            return string.Equals(Convert.ToHexString(hash), Sha256,
                StringComparison.OrdinalIgnoreCase);
        }
        catch (IOException) { return false; }
        catch (UnauthorizedAccessException) { return false; }
    }

    internal static async Task<bool> InstallAsync(CancellationToken cancellationToken = default)
    {
        await InstallationLock.WaitAsync(cancellationToken);
        try
        {
            if (await IsValidAsync(cancellationToken)) return true;
            Directory.CreateDirectory(ModelDirectory);
            var drive = new DriveInfo(Path.GetPathRoot(ModelDirectory)!);
            if (drive.AvailableFreeSpace < 3_000_000_000)
                throw new IOException("Espaço livre insuficiente: são necessários pelo menos 3 GB.");
            var temporary = ModelPath + ".partial";
            try
            {
                // Never trust an existing .partial as the final model.
                if (File.Exists(temporary)) File.Delete(temporary);
                using var request = new HttpRequestMessage(HttpMethod.Get, DownloadUri);
                using var response = await Client.SendAsync(request,
                    HttpCompletionOption.ResponseHeadersRead, cancellationToken);
                response.EnsureSuccessStatusCode();
                if (response.Content.Headers.ContentLength is long expected
                    && (expected < 1_000_000_000 || expected > 2_500_000_000))
                    throw new InvalidDataException("Tamanho do modelo inesperado.");
                await using (var output = new FileStream(temporary, FileMode.CreateNew,
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
                        if (total > 2_500_000_000)
                            throw new InvalidDataException("Download excede o limite esperado.");
                        await output.WriteAsync(buffer.AsMemory(0, bytes), cancellationToken);
                    }
                    if (total < 1_000_000_000)
                        throw new InvalidDataException("Download incompleto.");
                    await output.FlushAsync(cancellationToken);
                }
                await using (var downloaded = new FileStream(temporary, FileMode.Open,
                    FileAccess.Read, FileShare.Read, 1024 * 1024, FileOptions.Asynchronous))
                {
                    var hash = await SHA256.HashDataAsync(downloaded, cancellationToken);
                    if (!string.Equals(Convert.ToHexString(hash), Sha256,
                        StringComparison.OrdinalIgnoreCase))
                        throw new InvalidDataException("O arquivo baixado não passou na verificação SHA-256.");
                }
                File.Move(temporary, ModelPath, overwrite: true);
                return true;
            }
            finally
            {
                if (File.Exists(temporary)) File.Delete(temporary);
            }
        }
        finally { InstallationLock.Release(); }
    }
}
