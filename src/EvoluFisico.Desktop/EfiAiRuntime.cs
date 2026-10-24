using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Sockets;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace EvoluFisico.Desktop;

/// <summary>
/// Runs a packaged llama-server only on 127.0.0.1, with an unpredictable API key.
/// No untrusted executable paths, remote services, or shell commands are accepted.
/// Each inference is bounded, and the child process is stopped afterwards.
/// </summary>
internal static class EfiAiRuntime
{
    private static readonly SemaphoreSlim RunLock = new(1, 1);

    internal static async Task<string> ExplainAsync(string validatedSummary,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(validatedSummary) || validatedSummary.Length > 6000)
            throw new ArgumentException("Resumo EFIA ausente ou excede os limites.");
        var selected = EfiAiModelManager.Get(EfiAiModelManager.SelectedId);
        if (!await EfiAiModelManager.IsValidAsync(selected.Id, cancellationToken))
            throw new InvalidOperationException("Instale o pacote Qwen antes de solicitar a interpretação.");
        if (!File.Exists(EfiAiModelManager.RuntimePath))
            throw new InvalidOperationException("Motor de inferência ainda não foi incluído neste build Alpha.");

        if (!await RunLock.WaitAsync(0, cancellationToken))
            throw new InvalidOperationException("A EFI já está processando uma análise.");
        try
        {
            int port;
            using (var reservation = new TcpListener(IPAddress.Loopback, 0))
            {
                reservation.Start();
                port = ((IPEndPoint)reservation.LocalEndpoint).Port;
            }
            var secret = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
            var start = new ProcessStartInfo(EfiAiModelManager.RuntimePath)
            {
                UseShellExecute = false,
                CreateNoWindow = true,
                WorkingDirectory = Path.GetDirectoryName(EfiAiModelManager.RuntimePath)!
            };
            foreach (var arg in new[]
            {
                "-m", EfiAiModelManager.ModelPath(selected), "--host", "127.0.0.1",
                "--port", port.ToString(), "-c", "4096", "-t", "4", "-ngl", "0",
                "--api-key", secret
            }) start.ArgumentList.Add(arg);
            using var process = Process.Start(start)
                ?? throw new InvalidOperationException("Falha ao iniciar o motor EFI.");
            try
            {
                using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(120) };
                http.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", secret);
                var address = new Uri($"http://127.0.0.1:{port}/");
                using var readiness = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                readiness.CancelAfter(TimeSpan.FromSeconds(75));
                bool ready = false;
                while (!readiness.IsCancellationRequested)
                {
                    if (process.HasExited) throw new InvalidOperationException(
                        "O motor EFI encerrou antes de carregar o modelo.");
                    try
                    {
                        using var ping = await http.GetAsync(new Uri(address, "health"),
                            readiness.Token);
                        if (ping.IsSuccessStatusCode) { ready = true; break; }
                    }
                    catch (HttpRequestException) { }
                    catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested) { break; }
                    await Task.Delay(750, readiness.Token);
                }
                if (!ready) throw new TimeoutException("Tempo excedido ao carregar o motor EFI.");

                var prompt = "Você é um assistente de redação técnica em avaliação física. " +
                    "Escreva um parágrafo conciso em português brasileiro apenas com fatos do resumo validado. " +
                    "Não invente números, métodos, diagnósticos, causas ou prescrições. " +
                    "Se houver bloqueio de auditoria, explique a limitação e não apresente conclusões. " +
                    "A resposta precisa de revisão profissional. Resumo EFIA:\n" + validatedSummary;
                var body = JsonSerializer.Serialize(new
                {
                    messages = new[] {
                        new { role = "system", content = "Interprete somente os dados validados; nenhuma conclusão clínica." },
                        new { role = "user", content = prompt }
                    },
                    stream = false,
                    max_tokens = 700,
                    temperature = 0.2,
                    chat_template_kwargs = new { enable_thinking = false }
                });
                using var response = await http.PostAsync(new Uri(address, "v1/chat/completions"),
                    new StringContent(body, Encoding.UTF8, "application/json"), cancellationToken);
                response.EnsureSuccessStatusCode();
                await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
                using var json = await JsonDocument.ParseAsync(stream,
                    new JsonDocumentOptions { MaxDepth = 20 }, cancellationToken);
                var message = json.RootElement.GetProperty("choices")[0].GetProperty("message");
                var content = message.GetProperty("content").GetString()?.Trim() ?? "";
                if (content.Length == 0 || content.Length > 8000)
                    throw new InvalidDataException("O modelo não retornou texto utilizável.");
                return content;
            }
            finally
            {
                try { if (!process.HasExited) process.Kill(entireProcessTree: true); }
                catch (InvalidOperationException) { }
                try { await process.WaitForExitAsync(CancellationToken.None); }
                catch (InvalidOperationException) { }
            }
        }
        finally { RunLock.Release(); }
    }
}
