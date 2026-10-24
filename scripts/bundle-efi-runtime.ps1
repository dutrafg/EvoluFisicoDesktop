param(
  [string]$PublishDir = (Join-Path (Split-Path -Parent $PSScriptRoot) 'publish/win-x64')
)
$ErrorActionPreference = 'Stop'
# Pin upstream llama.cpp Windows x64 CPU release and its official GitHub SHA-256 digest.
# This does not download a GGUF: individual models remain optional and are opt-in.
$tag = 'b11798'
$url = "https://github.com/ggml-org/llama.cpp/releases/download/$tag/llama-$tag-bin-win-cpu-x64.zip"
$expected = 'ee0a6715749b63bc61c193152d9442b98e13403870eb54083d64bcf407d4d375'
$temp = Join-Path $env:RUNNER_TEMP 'efi-runtime-download'
if (!$env:RUNNER_TEMP) { $temp = Join-Path $env:TEMP 'efi-runtime-download' }
New-Item -ItemType Directory -Force -Path $temp | Out-Null
$zip = Join-Path $temp 'llama-cpu.zip'
$extract = Join-Path $temp 'unpacked'
$dest = Join-Path $PublishDir 'ai-runtime'
try {
  Invoke-WebRequest -Uri $url -OutFile $zip -MaximumRedirection 8
  $actual = (Get-FileHash $zip -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actual -ne $expected) { throw "llama.cpp SHA-256 mismatch: $actual" }
  Expand-Archive -Path $zip -DestinationPath $extract -Force
  $server = Get-ChildItem $extract -Filter 'llama-server.exe' -Recurse -File | Select-Object -First 1
  if (!$server) { throw 'Release did not include llama-server.exe' }
  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  Copy-Item -Path $server.FullName -Destination (Join-Path $dest $server.Name) -Force
  Get-ChildItem -Path $server.Directory.FullName -Filter '*.dll' -File |
    ForEach-Object { Copy-Item $_.FullName -Destination (Join-Path $dest $_.Name) -Force }
  $dlls = @(Get-ChildItem $dest -Filter '*.dll' -File)
  if ($dlls.Count -lt 2) { throw 'Runtime native dependencies appear incomplete' }
  Write-Host "Bundled llama.cpp $tag ($($dlls.Count) DLLs)"
} finally {
  if (Test-Path $temp) { Remove-Item $temp -Recurse -Force -ErrorAction SilentlyContinue }
}
