using System;
using System.IO;
namespace EvoluFisico.Desktop;

/// <summary>Alpha and production never share a native database, WebView profile or GGUF directory.</summary>
internal static class EfiAppPaths
{
#if EFI_ALPHA
    internal const bool IsAlpha = true;
    private const string ApplicationFolder = "EvoluFisicoDesktopEFIAlpha";
#else
    internal const bool IsAlpha = false;
    private const string ApplicationFolder = "EvoluFisicoDesktop";
#endif
    internal static readonly string Root = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        ApplicationFolder);
    internal static string WebViewProfile => Path.Combine(Root, "WebView2");
    internal static string Database => Path.Combine(Root, "Data", "records.sqlite");
    internal static string ModelDirectory => Path.Combine(Root, "EFI", "models");
}
