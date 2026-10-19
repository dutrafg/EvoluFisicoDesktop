$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$project = Join-Path $root 'src/EvoluFisico.Desktop/EvoluFisico.Desktop.csproj'
$index = Join-Path $root 'src/EvoluFisico.Desktop/wwwroot/index.html'
if (!(Test-Path $index)) { throw 'Frontend ausente: adicione wwwroot/index.html antes de compilar.' }
dotnet restore $project
if ($LASTEXITCODE -ne 0) { throw 'Falha no restore' }
dotnet publish $project -c Release -r win-x64 --self-contained true -p:PublishSingleFile=false -o (Join-Path $root 'publish/win-x64')
if ($LASTEXITCODE -ne 0) { throw 'Falha no publish' }
Write-Host 'Publicacao concluida em publish/win-x64'
