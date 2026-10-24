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
    private const string CurrentVersion = "1.0.13";
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
    private static DateTimeOffset? InstalledBuildTime()
    {
        try
        {
            var file = Path.Combine(AppContext.BaseDirectory, "wwwroot", "desktop-version.json");
            using var doc = JsonDocument.Parse(File.ReadAllText(file));
            var value = doc.RootElement.GetProperty("built_at").GetString();
            return DateTimeOffset.TryParse(value, out var parsed) ? parsed : null;
        }
        catch { return null; }
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
            var profile = EfiAppPaths.WebViewProfile;
            Directory.CreateDirectory(profile);
            if (EfiAppPaths.IsAlpha)
            {
                try { EfiDemoSeed.Ensure(); }
                catch (Exception ex)
                {
                    Debug.WriteLine("Falha na carga das avaliações sintéticas: " + ex.GetType().Name);
                    MessageBox.Show(
                        "Não foi possível carregar os alunos de demonstração. O banco existente foi preservado. Detalhes: " + ex.Message,
                        "EFI Alpha — dados fictícios", MessageBoxButton.OK, MessageBoxImage.Warning);
                }
            }

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
                string? command = null;
                try { command = args.TryGetWebMessageAsString(); }
                catch (ArgumentException) { /* Structured JSON message, handled below. */ }
                if (command is "check-updates" or "check-updates-auto")
                    await CheckUpdatesAsync();
                else if (command is null && !await TryHandleEfiAiMessageAsync(args))
                    HandleStorageMessage(args);
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

    // Native encrypted persistence endpoint. Only the packaged application origin may invoke it.
    // The legacy IndexedDB store remains untouched until a verified migration is available.
    private void HandleStorageMessage(CoreWebView2WebMessageReceivedEventArgs args)
    {
        try
        {
            if (!Uri.TryCreate(args.Source, UriKind.Absolute, out var source)
                || source.Scheme != Uri.UriSchemeHttps
                || !source.Host.Equals("evolufisico.local", StringComparison.OrdinalIgnoreCase)
                || !source.IsDefaultPort
                || source.AbsolutePath != "/index.html")
                return;
            using var message = JsonDocument.Parse(args.WebMessageAsJson);
            var root = message.RootElement;
            if (root.ValueKind != JsonValueKind.Object
                || !root.TryGetProperty("type", out var type)
                || type.GetString() != "native-storage")
                return;
            var id = root.GetProperty("requestId").GetString();
            var action = root.GetProperty("action").GetString();
            if (string.IsNullOrWhiteSpace(id) || id.Length > 80
                || !id.All(ch => char.IsAsciiLetterOrDigit(ch) || ch is '-' or '_'))
                return;
            string? result = null;
            var store = new EncryptedSqliteStore();
            switch (action)
            {
                case "health":
                    result = store.VerifyIntegrity() ? "ok" : "corrupt";
                    break;
                case "list":
                    result = JsonSerializer.Serialize(store.ListRecordIds());
                    break;
                case "read":
                {
                    var key = root.GetProperty("recordId").GetString() ?? "";
                    var data = store.Load(key);
                    result = data is null ? null : Convert.ToBase64String(data);
                    break;
                }
                case "write":
                {
                    var key = root.GetProperty("recordId").GetString() ?? "";
                    var base64 = root.GetProperty("data").GetString() ?? "";
                    if (base64.Length > 16_000_000) throw new InvalidDataException("Registro excede o limite permitido.");
                    store.Save(key, Convert.FromBase64String(base64));
                    result = "saved";
                    break;
                }
                case "import-batch":
                {
                    var entries = root.GetProperty("records");
                    if (entries.ValueKind != JsonValueKind.Object)
                        throw new InvalidDataException("Lote inválido.");
                    var records = new Dictionary<string, byte[]>(StringComparer.Ordinal);
                    long totalBytes = 0;
                    foreach (var entry in entries.EnumerateObject())
                    {
                        if (records.Count >= 1000 || string.IsNullOrWhiteSpace(entry.Name)
                            || entry.Name.Length > 128 || entry.Value.ValueKind != JsonValueKind.String)
                            throw new InvalidDataException("Lote excede os limites.");
                        var base64 = entry.Value.GetString() ?? "";
                        if (base64.Length > 16_000_000)
                            throw new InvalidDataException("Registro excede o limite permitido.");
                        var payload = Convert.FromBase64String(base64);
                        totalBytes += payload.Length;
                        if (totalBytes > 32_000_000)
                            throw new InvalidDataException("Lote excede o limite total.");
                        records.Add(entry.Name, payload);
                    }
                    store.ImportBatch(records);
                    result = records.Count.ToString(System.Globalization.CultureInfo.InvariantCulture);
                    break;
                }
                case "backup":
                {
                    var dialog = new Microsoft.Win32.SaveFileDialog
                    {
                        Title = "Salvar cópia protegida do banco SQLite",
                        Filter = "Banco SQLite (*.sqlite)|*.sqlite",
                        FileName = "EvoluFisicoDesktop-backup.sqlite",
                        AddExtension = true,
                        DefaultExt = ".sqlite",
                        OverwritePrompt = true
                    };
                    if (dialog.ShowDialog(this) != true)
                    {
                        result = "cancelled";
                        break;
                    }
                    store.BackupTo(dialog.FileName);
                    result = "saved";
                    break;
                }
                case "protect-data":
                {
                    var base64 = root.GetProperty("data").GetString() ?? "";
                    if (base64.Length > 16_000_000)
                        throw new InvalidDataException("Arquivo excede o limite.");
                    var plaintext = Convert.FromBase64String(base64);
                    try { result = Convert.ToBase64String(ProtectedVault.Encrypt(plaintext)); }
                    finally { System.Security.Cryptography.CryptographicOperations.ZeroMemory(plaintext); }
                    break;
                }
                case "unprotect-data":
                {
                    var base64 = root.GetProperty("data").GetString() ?? "";
                    if (base64.Length > 22_000_000)
                        throw new InvalidDataException("Arquivo protegido excede o limite.");
                    var payload = Convert.FromBase64String(base64);
                    try {
                        var plaintext = ProtectedVault.Decrypt(payload);
                        try { result = Convert.ToBase64String(plaintext); }
                        finally { System.Security.Cryptography.CryptographicOperations.ZeroMemory(plaintext); }
                    }
                    finally { System.Security.Cryptography.CryptographicOperations.ZeroMemory(payload); }
                    break;
                }
                case "replace-evaluations":
                {
                    var entries = root.GetProperty("records");
                    if (entries.ValueKind != JsonValueKind.Object)
                        throw new InvalidDataException("Lote de avaliações inválido.");
                    var records = new Dictionary<string, byte[]>(StringComparer.Ordinal);
                    long totalBytes = 0;
                    foreach (var entry in entries.EnumerateObject())
                    {
                        if (records.Count >= 1000 || !entry.Name.StartsWith("ef-eval-", StringComparison.Ordinal)
                            || entry.Name.Length > 128 || entry.Value.ValueKind != JsonValueKind.String)
                            throw new InvalidDataException("Identificador de avaliação inválido.");
                        var base64 = entry.Value.GetString() ?? "";
                        if (base64.Length > 16_000_000) throw new InvalidDataException("Registro excede o limite permitido.");
                        var data = Convert.FromBase64String(base64);
                        totalBytes += data.Length;
                        if (totalBytes > 32_000_000) throw new InvalidDataException("Lote excede o limite total.");
                        records.Add(entry.Name, data);
                    }
                    store.ReplaceEvaluations(records);
                    result = "restored";
                    break;
                }
                case "delete-evaluation":
                {
                    var key = root.GetProperty("recordId").GetString() ?? "";
                    var entries = root.GetProperty("records");
                    if (entries.ValueKind != JsonValueKind.Object)
                        throw new InvalidDataException("Lote de avaliações inválido.");
                    var records = new Dictionary<string, byte[]>(StringComparer.Ordinal);
                    long totalBytes = 0;
                    foreach (var entry in entries.EnumerateObject())
                    {
                        if (records.Count >= 1000 || string.IsNullOrWhiteSpace(entry.Name)
                            || entry.Name.Length > 128 || entry.Value.ValueKind != JsonValueKind.String)
                            throw new InvalidDataException("Lote de avaliações excede os limites.");
                        var base64 = entry.Value.GetString() ?? "";
                        if (base64.Length > 16_000_000)
                            throw new InvalidDataException("Registro excede o limite permitido.");
                        var payload = Convert.FromBase64String(base64);
                        totalBytes += payload.Length;
                        if (totalBytes > 32_000_000)
                            throw new InvalidDataException("Lote excede o limite total.");
                        records.Add(entry.Name, payload);
                    }
                    store.DeleteEvaluationWithUpdates(key, records);
                    result = "deleted";
                    break;
                }
                case "delete":
                {
                    var key = root.GetProperty("recordId").GetString() ?? "";
                    result = store.Delete(key) ? "deleted" : "missing";
                    break;
                }
                default: throw new InvalidDataException("Operação não permitida.");
            }
            SendStorageResponse(id, result, null);
        }
        catch (Exception ex)
        {
            // Do not disclose record contents or passwords in error responses.
            string? id = null;
            try
            {
                using var doc = JsonDocument.Parse(args.WebMessageAsJson);
                if (doc.RootElement.TryGetProperty("requestId", out var requestId))
                    id = requestId.GetString();
            }
            catch { /* Invalid input */ }
            if (!string.IsNullOrWhiteSpace(id) && id.Length <= 80)
                SendStorageResponse(id, null, ex is System.Security.Cryptography.CryptographicException
                    ? "Não foi possível descriptografar o registro." : "Operação de armazenamento não concluída.");
        }
    }

    private void SendStorageResponse(string requestId, string? data, string? error)
    {
        Browser.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(new
        {
            type = "native-storage-result", requestId, data, error
        }));
    }

    private async Task CheckUpdatesAsync()
    {
        if (EfiAppPaths.IsAlpha)
        {
            if (_ready && Browser.CoreWebView2 is not null)
                Browser.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(new
                {
                    type = "desktop-update",
                    message = "Você está no canal EFI Alpha, separado da versão estável. As atualizações experimentais são distribuídas em instaladores de teste.",
                    downloadUrl = (string?)null
                }));
            return;
        }
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
                    && r.GetProperty("tag_name").GetString()?.StartsWith("desktop-v1.0-") == true)
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
                var publishedAt = DateTimeOffset.TryParse(latest.GetProperty("published_at").GetString(), out var published) ? published : (DateTimeOffset?)null;
                var installedAt = InstalledBuildTime();
                if (installed == tag || (installedAt.HasValue && publishedAt.HasValue && publishedAt.Value <= installedAt.Value))
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
