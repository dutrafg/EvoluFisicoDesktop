using System;
using System.IO;
using System.Windows;
using Microsoft.Web.WebView2.Core;

namespace EvoluFisico.Desktop;

public partial class MainWindow : Window
{
    private const string AppUrl = "https://evolufisico.local/index.html";
    private bool _ready;

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
}
