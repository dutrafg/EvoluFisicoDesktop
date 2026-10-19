$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$project = Join-Path $root 'src/EvoluFisico.Desktop/EvoluFisico.Desktop.csproj'
$web = Join-Path $root 'src/EvoluFisico.Desktop/wwwroot'
if (!(Test-Path (Join-Path $web 'index.html'))) { throw 'Frontend ausente: wwwroot/index.html' }
foreach ($size in @('192','512')) {
  $encoded = Join-Path $root "installer/resources/icon-$size.png.base64"
  $output = Join-Path $web "icon-$size.png"
  if (!(Test-Path $output)) {
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
dotnet restore $project
if ($LASTEXITCODE -ne 0) { throw 'Falha no restore' }
dotnet publish $project -c Release -r win-x64 --self-contained true -p:PublishSingleFile=false -o (Join-Path $root 'publish/win-x64')
if ($LASTEXITCODE -ne 0) { throw 'Falha no publish' }
if (!(Test-Path (Join-Path $root 'publish/win-x64/EvoluFisico.Desktop.exe'))) { throw 'Executavel nao encontrado apos publish' }
Write-Host 'Publicacao concluida em publish/win-x64'
