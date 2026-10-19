using System;
using System.IO;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using System.Linq;
using System.Windows;
using Microsoft.Web.WebView2.Core;

namespace EvoluFisico.Desktop;

public partial class MainWindow : Window
{
    private const string AppUrl = "https://evolufisico.local/index.html";
    private bool _ready;
    private const string CurrentVersion = "9.0.0-beta.1";
    private static readonly HttpClient UpdateClient = new() { Timeout = TimeSpan.FromSeconds(15) };

    public MainWindow()
    {
        InitializeComponent();
        Loaded += OnLoaded;
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        try
        {
            var profile = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "EvoluFisicoDesktop", "WebView2");
            Directory.CreateDirectory(profile);

            var web = Path.Combine(AppContext.BaseDirectory, "wwwroot");
            var index = Path.Combine(web, "index.html");
            if (!File.Exists(index))
            {
                MessageBox.Show(
                    "Os arquivos da interface 9.0 não foram encontrados na pasta wwwroot. Reinstale o aplicativo.",
                    "EvoluFisico Desktop", MessageBoxButton.OK, MessageBoxImage.Error);
                return;
            }

            var environment = await CoreWebView2Environment.CreateAsync(null, profile);
            await Browser.EnsureCoreWebView2Async(environment);
            Browser.CoreWebView2.SetVirtualHostNameToFolderMapping(
                "evolufisico.local", web, CoreWebView2HostResourceAccessKind.DenyCors);

            Browser.CoreWebView2.NavigationCompleted += (_, args) =>
            {
                if (!args.IsSuccess)
                    MessageBox.Show(
                        "Falha ao carregar a interface local: " + args.WebErrorStatus,
                        "EvoluFisico Desktop", MessageBoxButton.OK, MessageBoxImage.Warning);
            };
            Browser.CoreWebView2.WebMessageReceived += async (_, args) =>
            {
                if (args.TryGetWebMessageAsString() == "check-updates") await CheckUpdatesAsync();
            };
            _ready = true;
            Browser.CoreWebView2.Navigate(AppUrl);
        }
        catch (WebView2RuntimeNotFoundException)
        {
            MessageBox.Show(
                "O Microsoft Edge WebView2 Runtime é necessário para executar este aplicativo. Instale-o pelo site oficial da Microsoft e abra o EvoluFisico novamente.",
                "WebView2 Runtime ausente", MessageBoxButton.OK, MessageBoxImage.Error);
        }
        catch (Exception ex)
        {
            MessageBox.Show("Erro ao iniciar o EvoluFisico Desktop: " + ex.Message,
                "EvoluFisico Desktop", MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    private void Home_Click(object sender, RoutedEventArgs e)
    {
        if (_ready) Browser.CoreWebView2.Navigate(AppUrl);
    }

    private void Reload_Click(object sender, RoutedEventArgs e)
    {
        if (_ready) Browser.CoreWebView2.Reload();
    }

    private void Print_Click(object sender, RoutedEventArgs e)
    {
        if (_ready) Browser.CoreWebView2.ShowPrintUI();
    }
    private async Task CheckUpdatesAsync()
    {
        string message;
        string? downloadUrl = null;
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get,
                "https://api.github.com/repos/dutrafg/EvoluFisicoDesktop/releases?per_page=15");
            request.Headers.UserAgent.ParseAdd("EvoluFisicoDesktop/9.0");
            request.Headers.Accept.ParseAdd("application/vnd.github+json");
            using var response = await UpdateClient.SendAsync(request);
            response.EnsureSuccessStatusCode();
            using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            var latest = doc.RootElement.EnumerateArray()
                .Where(r => !r.GetProperty("draft").GetBoolean())
                .FirstOrDefault(r => r.GetProperty("tag_name").GetString()?.StartsWith("desktop-v9.0-beta-") == true);
            if (latest.ValueKind == JsonValueKind.Undefined)
            {
                message = "Nenhuma atualização publicada no GitHub Releases.";
            }
            else
            {
                var tag = latest.GetProperty("tag_name").GetString() ?? "";
                var assets = latest.GetProperty("assets").EnumerateArray();
                foreach (var asset in assets)
                {
                    var name = asset.GetProperty("name").GetString() ?? "";
                    if (name.EndsWith("-Setup.exe", StringComparison.OrdinalIgnoreCase))
                    {
                        downloadUrl = asset.GetProperty("browser_download_url").GetString();
                        break;
                    }
                }
                message = downloadUrl is null
                    ? "Versão publicada, mas sem instalador Windows disponível."
                    : $"Versão publicada: {tag}. Versão instalada: {CurrentVersion}. Baixe o instalador para atualizar.";
            }
        }
        catch (Exception ex)
        {
            message = "Não foi possível consultar as atualizações: " + ex.Message;
        }
        if (_ready && Browser.CoreWebView2 is not null)
            Browser.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(new
            {
                type = "desktop-update", message, downloadUrl
            }));
    }

}
