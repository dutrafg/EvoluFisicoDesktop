using System;
using System.IO;
using System.Diagnostics;
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
    private static string InstalledTag()
    {
        try
        {
            var file = Path.Combine(AppContext.BaseDirectory, "wwwroot", "desktop-version.json");
            using var doc = JsonDocument.Parse(File.ReadAllText(file));
            return doc.RootElement.GetProperty("tag").GetString() ?? "";
        }
        catch { return ""; }
    }
    private static readonly HttpClient UpdateClient = new() { Timeout = TimeSpan.FromSeconds(15) };
    private bool _checkingUpdates;

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

            Browser.CoreWebView2.NewWindowRequested += (_, args) =>
            {
                args.Handled = true;
                if (Uri.TryCreate(args.Uri, UriKind.Absolute, out var target)
                    && target.Scheme == Uri.UriSchemeHttps
                    && target.Host.Equals("github.com", StringComparison.OrdinalIgnoreCase)
                    && target.AbsolutePath.StartsWith("/dutrafg/EvoluFisicoDesktop/releases/download/", StringComparison.OrdinalIgnoreCase))
                {
                    try { Process.Start(new ProcessStartInfo(target.AbsoluteUri) { UseShellExecute = true }); }
                    catch (Exception ex) { MessageBox.Show("Não foi possível abrir o download: " + ex.Message); }
                }
            };
            Browser.CoreWebView2.NavigationStarting += (_, args) =>
            {
                if (!Uri.TryCreate(args.Uri, UriKind.Absolute, out var destination)
                    || !destination.Scheme.Equals("https", StringComparison.OrdinalIgnoreCase)
                    || !destination.Host.Equals("evolufisico.local", StringComparison.OrdinalIgnoreCase))
                {
                    args.Cancel = true;
                    if (Uri.TryCreate(args.Uri, UriKind.Absolute, out var external)
                        && external.Scheme == Uri.UriSchemeHttps)
                    {
                        try { Process.Start(new ProcessStartInfo(external.AbsoluteUri) { UseShellExecute = true }); }
                        catch (Exception ex) { MessageBox.Show("Não foi possível abrir o link: " + ex.Message); }
                    }
                }
            };
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

    private async Task CheckUpdatesAsync()
    {
        if (_checkingUpdates) return;
        _checkingUpdates = true;
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
                .Where(r => !r.GetProperty("draft").GetBoolean()
                    && r.GetProperty("tag_name").GetString()?.StartsWith("desktop-v9.0-beta-") == true)
                .OrderByDescending(r => r.GetProperty("published_at").GetString())
                .FirstOrDefault();
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
                var installed = InstalledTag();
                if (installed == tag)
                {
                    message = $"Você já utiliza a versão mais recente ({CurrentVersion}, {tag}).";
                    downloadUrl = null;
                }
                else if (string.IsNullOrWhiteSpace(installed))
                {
                    message = downloadUrl is null
                        ? "Versão instalada sem identificação e nenhum instalador disponível."
                        : "Esta instalação é anterior ao controle de versões. Você pode baixar o instalador publicado e atualizar manualmente, após fazer backup dos dados.";
                }
                else
                {
                    message = downloadUrl is null
                        ? "Versão publicada, mas sem instalador Windows disponível."
                        : $"Versão disponível: {tag}. Instalada: {installed}. Baixe o instalador para atualizar.";
                }
            }
        }
        catch (Exception ex)
        {
            message = "Não foi possível consultar as atualizações: " + ex.Message;
        }
        try
        {
            if (_ready && Browser.CoreWebView2 is not null)
                Browser.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(new
                {
                    type = "desktop-update", message, downloadUrl
                }));
        }
        catch (Exception ex)
        {
            Debug.WriteLine("Falha ao informar resultado da atualização: " + ex.Message);
        }
        finally { _checkingUpdates = false; }
    }

}
