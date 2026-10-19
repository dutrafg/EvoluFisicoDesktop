from pathlib import Path
import re, subprocess, sys
root=Path(__file__).resolve().parents[1]/"src"/"EvoluFisico.Desktop"/"wwwroot"
html=root/"index.html"
if not html.is_file():
    sys.exit("ERRO: index.html ausente")
text=html.read_text(encoding="utf-8")
missing=[]
for rel in re.findall(r'''(?:src|href)\s*=\s*["'](?:\./)?(assets/[^"'?#]+)''',text):
    if not (root/rel).is_file(): missing.append(rel)
for file in sorted(root.rglob("*.js")):
    r=subprocess.run(["node","--check",str(file)],capture_output=True,text=True)
    if r.returncode:
        print(r.stderr)
        sys.exit(f"ERRO de sintaxe: {file}")
if missing: sys.exit("Arquivos ausentes: "+", ".join(sorted(set(missing))))
print(f"QA estatico OK: {len(list(root.rglob('*.js')))} scripts, {len(set(re.findall(r'''(?:src|href)\s*=\s*["'](?:\./)?(assets/[^"'?#]+)''',text)))} referencias de assets")
