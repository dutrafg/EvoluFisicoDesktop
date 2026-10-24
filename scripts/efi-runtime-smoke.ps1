$ErrorActionPreference = 'Stop'
# CI-only offline inference smoke with synthetic text, a pinned GGUF and a bundled CPU server.
# No production, personal or student data is used.
$root = Split-Path -Parent $PSScriptRoot
$exe = Join-Path $root 'publish/win-x64/ai-runtime/llama-server.exe'
if (!(Test-Path $exe)) { throw 'Bundled llama-server missing.' }
$folder = Join-Path $env:RUNNER_TEMP 'efi-real-inference'
if (!$env:RUNNER_TEMP) { $folder = Join-Path $env:TEMP 'efi-real-inference' }
New-Item -ItemType Directory -Force -Path $folder | Out-Null
$model = Join-Path $folder 'Qwen3.5-2B-Q4_K_M.gguf'
$url = 'https://huggingface.co/SoAIHQ/Qwen3.5-2B-GGUF/resolve/main/Qwen3.5-2B-Q4_K_M.gguf'
$sha256 = 'a8b50de00b780c0f3c16f07cb041a1ecd678b6e22fd8cde91e57fe4b5031523b'
$server = $null
try {
  Write-Host 'Downloading the pinned Qwen3.5-2B model for synthetic inference.'
  Invoke-WebRequest -Uri $url -OutFile $model -MaximumRedirection 8
  if ((Get-FileHash $model -Algorithm SHA256).Hash.ToLowerInvariant() -ne $sha256) {
    throw 'Qwen GGUF SHA-256 mismatch'
  }
  $secret = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
  $port = 19381
  $arguments = @('-m', ('"' + $model + '"'), '--host', '127.0.0.1',
    '--port', "$port", '-c', '2048', '-t', '4', '-ngl', '0', '--api-key', $secret)
  Write-Host 'Starting bundled llama-server with Qwen3.5-2B on Windows CPU.'
  $server = Start-Process -FilePath $exe -ArgumentList $arguments -WorkingDirectory (Split-Path $exe) -PassThru -WindowStyle Hidden
  $ready = $false
  $healthUrl = "http://127.0.0.1:${port}/health"
  $headers = @{Authorization = "Bearer $secret"}
  for ($i=0; $i -lt 180; $i++) {
    if ($server.HasExited) { throw "Qwen runtime exited early ($($server.ExitCode))." }
    try {
      $response = Invoke-RestMethod -Uri $healthUrl -Headers $headers -Method GET -TimeoutSec 2
      if ($response.status -eq 'ok') { $ready = $true; break }
    } catch { }
    Start-Sleep -Seconds 1
  }
  if (!$ready) { throw 'Qwen runtime failed to become healthy in 180 seconds.' }
  $body = @{
    stream = $false
    temperature = 0.1
    max_tokens = 90
    chat_template_kwargs = @{enable_thinking=$false}
    messages = @(
      @{role='system';content='Responda em português, sem diagnóstico nem números inventados.'},
      @{role='user';content='Teste com dados completamente fictícios. Diga em uma frase que o motor de IA local está funcionando.'}
    )
  } | ConvertTo-Json -Depth 10
  $completion = Invoke-RestMethod -Uri "http://127.0.0.1:${port}/v1/chat/completions" -Headers $headers -Method POST -ContentType 'application/json' -Body $body -TimeoutSec 180
  $answer = [string]$completion.choices[0].message.content
  if ([string]::IsNullOrWhiteSpace($answer) -or $answer.Length -gt 8000) {
    throw 'Local model returned no suitable text.'
  }
  Write-Host 'PASS: pinned Qwen3.5-2B model loaded, responded in Portuguese, and returned an OpenAI-compatible completion.'
} finally {
  if ($server) {
    try { if (!$server.HasExited) { Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue } }
    catch { }
  }
  if (Test-Path $folder) { Remove-Item $folder -Recurse -Force -ErrorAction SilentlyContinue }
}
