using System;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Web.WebView2.Core;

namespace EvoluFisico.Desktop;

/// <summary>Isolated WebView2 message endpoint for local EFI features.</summary>
public partial class MainWindow
{
    private async Task<bool> TryHandleEfiAiMessageAsync(CoreWebView2WebMessageReceivedEventArgs args)
    {
        if (!Uri.TryCreate(args.Source, UriKind.Absolute, out var source)
            || source.Scheme != Uri.UriSchemeHttps
            || !source.Host.Equals("evolufisico.local", StringComparison.OrdinalIgnoreCase)
            || !source.IsDefaultPort
            || source.AbsolutePath != "/index.html")
            return false;

        string? requestId = null;
        string? action = null;
        string? summary = null;
        bool consent = false;
        try
        {
            using var doc = JsonDocument.Parse(args.WebMessageAsJson);
            var root = doc.RootElement;
            if (root.ValueKind != JsonValueKind.Object
                || !root.TryGetProperty("type", out var type)
                || type.GetString() != "efi-ai")
                return false;

            // Reject unknown/oversized messages without touching a model or file.
            if (args.WebMessageAsJson.Length > 10_000
                || !root.TryGetProperty("requestId", out var id))
                return true;
            requestId = id.GetString();
            if (string.IsNullOrWhiteSpace(requestId) || requestId.Length > 80
                || !System.Linq.Enumerable.All(requestId,
                    c => char.IsAsciiLetterOrDigit(c) || c is '-' or '_'))
                return true;
            if (!root.TryGetProperty("action", out var kind)) return true;
            action = kind.GetString();
            if (root.TryGetProperty("consent", out var approved)
                && approved.ValueKind == JsonValueKind.True)
                consent = true;
            if (action == "analyze")
            {
                if (!root.TryGetProperty("summary", out var payload)
                    || payload.ValueKind != JsonValueKind.String)
                    return true;
                summary = payload.GetString();
            }
        }
        catch (JsonException) { return false; }
        catch (InvalidOperationException) { return true; }

        try
        {
            object answer = action switch
            {
                "status" => new
                {
                    installed = await EfiAiModelManager.IsValidAsync(),
                    runtimeReady = File.Exists(EfiAiModelManager.RuntimePath),
                    model = EfiAiModelManager.ModelName
                },
                "install" when consent => new
                {
                    installed = await EfiAiModelManager.InstallAsync(),
                    model = EfiAiModelManager.ModelName
                },
                "install" => throw new InvalidOperationException(
                    "Confirme o download do pacote Qwen na interface."),
                "analyze" => new
                {
                    text = await EfiAiRuntime.ExplainAsync(summary ?? "")
                },
                _ => throw new InvalidOperationException("Comando EFI não autorizado.")
            };
            SendEfiAiResponse(requestId!, true, answer, null);
        }
        catch (Exception ex) when (
            ex is IOException or HttpRequestException or InvalidDataException
            or ArgumentException or InvalidOperationException or TimeoutException)
        {
            // No prompt or student content is written to logs.
            SendEfiAiResponse(requestId!, false, null, ex.Message);
        }
        catch (Exception)
        {
            SendEfiAiResponse(requestId!, false, null,
                "Não foi possível completar a operação EFI.");
        }
        return true;
    }

    private void SendEfiAiResponse(string requestId, bool ok, object? data, string? error)
    {
        if (!_ready || Browser.CoreWebView2 is null) return;
        Browser.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(new
        {
            type = "efi-ai-result",
            requestId,
            ok,
            data,
            error
        }));
    }
}
