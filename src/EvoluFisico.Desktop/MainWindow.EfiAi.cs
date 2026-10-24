using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Web.WebView2.Core;

namespace EvoluFisico.Desktop;

/// <summary>Origin-checked, allowlisted WebView2 commands for the local model catalog.</summary>
public partial class MainWindow
{
    private static async Task<object> EfiCatalogStatusAsync()
    {
        var models = new List<object>();
        foreach (var model in EfiAiModelManager.Models)
        {
            models.Add(new {
                id = model.Id,
                label = model.Label,
                sizeGB = Math.Round(model.SizeBytes / 1_000_000_000.0, 2),
                recommendedRamGB = model.RecommendedRamGb,
                installed = await EfiAiModelManager.IsValidAsync(model.Id)
            });
        }
        return new {
            models,
            selectedId = EfiAiModelManager.SelectedId,
            runtimeReady = File.Exists(EfiAiModelManager.RuntimePath)
        };
    }

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
        string? modelId = null;
        bool consent = false;
        try
        {
            using var doc = JsonDocument.Parse(args.WebMessageAsJson);
            var root = doc.RootElement;
            if (root.ValueKind != JsonValueKind.Object
                || !root.TryGetProperty("type", out var type)
                || type.GetString() != "efi-ai")
                return false;

            if (args.WebMessageAsJson.Length > 10_000
                || !root.TryGetProperty("requestId", out var id))
                return true;
            requestId = id.GetString();
            if (string.IsNullOrWhiteSpace(requestId) || requestId.Length > 80
                || !requestId.All(c => char.IsAsciiLetterOrDigit(c) || c is '-' or '_'))
                return true;
            if (!root.TryGetProperty("action", out var kind)) return true;
            action = kind.GetString();
            if (root.TryGetProperty("consent", out var approved)
                && approved.ValueKind == JsonValueKind.True)
                consent = true;
            if (root.TryGetProperty("modelId", out var selected)
                && selected.ValueKind == JsonValueKind.String)
                modelId = selected.GetString();
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
                "status" => await EfiCatalogStatusAsync(),
                "install" when consent => new {
                    installed = await EfiAiModelManager.InstallAsync(modelId!),
                    modelId
                },
                "install" => throw new InvalidOperationException(
                    "Confirme o download do pacote Qwen na interface."),
                "select" => await SelectEfiModelAsync(modelId!),
                "remove" when consent => await RemoveEfiModelAsync(modelId!),
                "remove" => throw new InvalidOperationException(
                    "Confirme a exclusão do modelo na interface."),
                "analyze" => new { text = await EfiAiRuntime.ExplainAsync(summary ?? "") },
                _ => throw new InvalidOperationException("Comando EFI não autorizado.")
            };
            SendEfiAiResponse(requestId!, true, answer, null);
        }
        catch (Exception ex) when (
            ex is IOException or HttpRequestException or InvalidDataException
            or ArgumentException or InvalidOperationException or TimeoutException)
        {
            SendEfiAiResponse(requestId!, false, null, ex.Message);
        }
        catch (Exception)
        {
            SendEfiAiResponse(requestId!, false, null,
                "Não foi possível completar a operação EFI.");
        }
        return true;
    }

    private static async Task<object> SelectEfiModelAsync(string id)
    {
        await EfiAiModelManager.SetSelectedAsync(id);
        return new { selectedId = id };
    }

    private static async Task<object> RemoveEfiModelAsync(string id)
    {
        await EfiAiModelManager.RemoveAsync(id);
        return new { removedId = id, selectedId = EfiAiModelManager.SelectedId };
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
