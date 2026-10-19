from pathlib import Path
import base64
import re
import subprocess
import sys

project = Path(__file__).resolve().parents[1]
root = project / "src" / "EvoluFisico.Desktop" / "wwwroot"
html = root / "index.html"
sw = root / "sw.js"

if not html.is_file() or not sw.is_file():
    sys.exit("ERRO: index.html ou sw.js ausente")

html_text = html.read_text(encoding="utf-8")
refs = set(re.findall(r'''(?:src|href)\s*=\s*["'](?:\./)?(assets/[^"'?#]+)''', html_text))
missing = [rel for rel in refs if not (root / rel).is_file()]

for file in sorted(root.rglob("*.js")):
    check = subprocess.run(["node", "--check", str(file)], capture_output=True, text=True)
    if check.returncode:
        sys.exit(f"ERRO de sintaxe: {file}\n{check.stderr}")

worker = sw.read_text(encoding="utf-8")
match = re.search(r"const PRECACHE_ASSETS\s*=\s*/\* PRECACHE_START \*/(\[.*?\])/\* PRECACHE_END \*/", worker, re.S)
if not match:
    sys.exit("ERRO: lista de precache nao encontrada")
precache = re.findall(r'"(\./[^"]*)"', match.group(1))
for entry in precache:
    if entry == "./":
        continue
    relative = entry.removeprefix("./")
    if relative in ("icon-192.png", "icon-512.png"):
        if (root / relative).is_file():
            continue
        encoded = project / "installer" / "resources" / (relative + ".base64")
        if not encoded.is_file():
            missing.append(relative)
            continue
        try:
            raw = base64.b64decode(encoded.read_text().strip(), validate=True)
            if len(raw) < 100 or not raw.startswith(b"\x89PNG\r\n\x1a\n"):
                missing.append(relative + " (PNG invalido)")
        except (ValueError, base64.binascii.Error):
            missing.append(relative + " (base64 invalido)")
    elif not (root / relative).is_file():
        missing.append(relative)

if missing:
    sys.exit("ERRO: recursos ausentes ou invalidos: " + ", ".join(sorted(set(missing))))

print(f"QA estatico OK: {len(list(root.rglob('*.js')))} scripts, {len(refs)} referencias HTML, {len(precache)} entradas de cache")
