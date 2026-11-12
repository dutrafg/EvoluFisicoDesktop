#!/usr/bin/env python3
"""Verificador Desktop RC-14: WebView2 possui SW nativo minimo, nao cache PWA."""
from pathlib import Path
import json,re,subprocess
root=Path(__file__).resolve().parents[1]/'src/EvoluFisico.Desktop/wwwroot'
html=(root/'index.html').read_text(encoding='utf-8')
sw=(root/'sw.js').read_text(encoding='utf-8')
manifest=json.loads((root/'manifest.webmanifest').read_text(encoding='utf-8'))
version=json.loads((root/'version.json').read_text(encoding='utf-8'))
assert len(html)>3_600_000 and 'window.EFNativeStorage' in html
assert manifest['version']==version['version']=='3.1.45'
assert version['source_web_commit']=='2e80aa6220ebaaf9430e387e2f7cbde324f918de'
assert "self.registration.unregister()" in sw, 'SW Windows nao deve manter cache web antigo'
refs=set(re.findall(r"""(?:src|href)\s*=\s*["'](?:\./)?(assets/[^"'?#]+)""",html))
missing=[r for r in refs if not (root/r).is_file()]
assert not missing,'Recursos HTML ausentes: '+', '.join(sorted(missing))
for path in (root/'assets/js/05-app-runtime.js',root/'assets/js/28-native-storage.js'):
    subprocess.run(['node','--check',str(path)],check=True)
print('PASS: frontend RC-14 com '+str(len(refs))+' recursos, SW WebView2 e SQLite nativo')
