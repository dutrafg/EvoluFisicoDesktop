using System;
using System.IO;
using System.Windows;
using Microsoft.Web.WebView2.Core;
namespace EvoluFisico.Desktop;
public partial class MainWindow : Window
{
    public MainWindow() { InitializeComponent(); Loaded += OnLoaded; }
    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        try
        {
            var profile = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "EvoluFisicoDesktop", "WebView2");
            Directory.CreateDirectory(profile);
            await Browser.EnsureCoreWebView2Async(await CoreWebView2Environment.CreateAsync(null, profile));
            var web = Path.Combine(AppContext.BaseDirectory, "wwwroot");
            var index = Path.Combine(web, "index.html");
            if (!File.Exists(index)) { MessageBox.Show("Frontend 9.0 não encontrado. Copie index.html e seus recursos para wwwroot."); return; }
            Browser.CoreWebView2.SetVirtualHostNameToFolderMapping("evolufisico.local", web, CoreWebView2HostResourceAccessKind.DenyCors);
            Browser.CoreWebView2.Navigate("https://evolufisico.local/index.html");
        }
        catch (Exception ex) { MessageBox.Show("Erro ao iniciar: " + ex.Message); }
    }
    private void Home_Click(object sender, RoutedEventArgs e) { Browser.CoreWebView2?.Navigate("https://evolufisico.local/index.html"); }
    private void Reload_Click(object sender, RoutedEventArgs e) { Browser.CoreWebView2?.Reload(); }
    private void Print_Click(object sender, RoutedEventArgs e) { Browser.CoreWebView2?.ShowPrintUI(); }
}
