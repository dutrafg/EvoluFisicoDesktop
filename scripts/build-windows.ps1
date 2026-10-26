$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$project = Join-Path $root 'src/EvoluFisico.Desktop/EvoluFisico.Desktop.csproj'
$web = Join-Path $root 'src/EvoluFisico.Desktop/wwwroot'
if (!(Test-Path (Join-Path $web 'index.html'))) { throw 'Frontend ausente: wwwroot/index.html' }
foreach ($size in @('192','512')) {
  $encoded = Join-Path $root "installer/resources/icon-$size.png.base64"
  $output = Join-Path $web "icon-$size.png"
  if ($true) {
    if (!(Test-Path $encoded)) { throw "Icone ausente: icon-$size.png" }
    [System.IO.File]::WriteAllBytes($output,[Convert]::FromBase64String(([IO.File]::ReadAllText($encoded)).Trim()))
  }
  $bytes = [System.IO.File]::ReadAllBytes($output)
  if ($bytes.Length -lt 100 -or
      $bytes[0] -ne 137 -or $bytes[1] -ne 80 -or
      $bytes[2] -ne 78 -or $bytes[3] -ne 71) {
    throw "Arquivo PNG invalido: $output"
  }
}
# Build a multi-resolution Windows .ico from the application's original PNG.
$iconDir = Join-Path $root 'src/EvoluFisico.Desktop/Assets'
New-Item -ItemType Directory -Force -Path $iconDir | Out-Null
$iconPath = Join-Path $iconDir 'EvoluFisico.ico'
Add-Type -AssemblyName System.Drawing
$sourcePng = Join-Path $web 'icon-512.png'
$frames = @()
$original = [System.Drawing.Image]::FromFile($sourcePng)
try {
  foreach ($size in @(16, 24, 32, 48, 64, 128, 256)) {
    $bitmap = [System.Drawing.Bitmap]::new($size, $size)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.DrawImage($original, 0, 0, $size, $size)
      } finally { $graphics.Dispose() }
      $frameStream = [System.IO.MemoryStream]::new()
      try {
        $bitmap.Save($frameStream, [System.Drawing.Imaging.ImageFormat]::Png)
        $frames += ,@{ Size = $size; Bytes = $frameStream.ToArray() }
      } finally { $frameStream.Dispose() }
    } finally { $bitmap.Dispose() }
  }
} finally { $original.Dispose() }
$stream = [System.IO.File]::Create($iconPath)
try {
  $writer = [System.IO.BinaryWriter]::new($stream)
  try {
    $writer.Write([uint16]0); $writer.Write([uint16]1); $writer.Write([uint16]$frames.Count)
    $offset = 6 + 16 * $frames.Count
    foreach ($frame in $frames) {
      $size = [int]$frame.Size
      $writer.Write([byte]($size % 256)); $writer.Write([byte]($size % 256))
      $writer.Write([byte]0); $writer.Write([byte]0)
      $writer.Write([uint16]1); $writer.Write([uint16]32)
      $writer.Write([uint32]$frame.Bytes.Length); $writer.Write([uint32]$offset)
      $offset += $frame.Bytes.Length
    }
    foreach ($frame in $frames) { $writer.Write([byte[]]$frame.Bytes) }
  } finally { $writer.Dispose() }
} finally { $stream.Dispose() }
if ((Get-Item $iconPath).Length -lt 1024) { throw 'Windows icon generation failed' }
Write-Host "Windows icon generated: $iconPath"
# Identify each release build so the updater can distinguish installed and published releases.
$revision = if ($env:GITHUB_SHA) { $env:GITHUB_SHA.Substring(0,7).ToLowerInvariant() } else { 'local' }
$tag = "desktop-v1.0-$revision"
$versionInfo = @{ tag = $tag; version = '1.0.12'; channel = 'RC-5'; source_web_version = '3.1.19'; source_web_commit = '945080cdf628bf703aaae939078241e483fff898'; revision = $revision; built_at = [DateTimeOffset]::UtcNow.ToString('o') } | ConvertTo-Json -Compress
[System.IO.File]::WriteAllText((Join-Path $web 'desktop-version.json'), $versionInfo, [System.Text.UTF8Encoding]::new($false))
dotnet restore $project
if ($LASTEXITCODE -ne 0) { throw 'Falha no restore' }
dotnet publish $project -c Release -r win-x64 --self-contained true -p:PublishSingleFile=false -o (Join-Path $root 'publish/win-x64')
if ($LASTEXITCODE -ne 0) { throw 'Falha no publish' }
if (!(Test-Path (Join-Path $root 'publish/win-x64/EvoluFisico.Desktop.exe'))) { throw 'Executavel nao encontrado apos publish' }
if (!(Test-Path (Join-Path $root 'publish/win-x64/wwwroot/desktop-version.json'))) { throw 'Version manifest not included in Windows publish' }
Write-Host 'Publicacao concluida em publish/win-x64'
