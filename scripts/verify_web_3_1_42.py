#!/usr/bin/env python3
"""Verify pinned Web 3.1.42 release, full Windows HTML and protected SQLite bridge."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
WWW=ROOT/'src/EvoluFisico.Desktop/wwwroot'
VERSION='3.1.42'
SOURCE='f133ce6cf8db85dbe239615639837c7ec89e4615'
html=(WWW/'index.html').read_text(encoding='utf-8')
version=json.loads((WWW/'version.json').read_text(encoding='utf-8'))
manifest=json.loads((WWW/'manifest.webmanifest').read_text(encoding='utf-8'))
patch=(ROOT/'scripts/web-3.1.41-to-3.1.42-index.patch').read_text(encoding='utf-8')
assert len(html)>3_600_000 and len(patch)>8_000
assert version['version']==VERSION and version['source_web_commit']==SOURCE
assert version['desktop_channel']=='RC' and manifest['version']==VERSION
for marker in ('"version":"3.1.42"', 'Versão 3.1.42 Release',
               'EvoStore','Perfil Unificado','Análises Completas',
               'EF_NATIVE_EVAL_PREFIX','window.EFNativeStorage',
               'loadDirectoryNative','ef-profile-professional',
               'ef-profile-student-','SQLite protegido',
               "button.eft-theme-option[data-eft-theme]",
               "document.querySelectorAll('#tab-painel, .top-navbar, #ef-workspace-heading')"):
    assert marker in html, f'Missing Web 3.1.42/native marker: {marker}'
for path,token in (
 ('src/EvoluFisico.Desktop/MainWindow.xaml.cs','CurrentVersion = "3.1.42"'),
 ('src/EvoluFisico.Desktop/EvoluFisico.Desktop.csproj','<AssemblyVersion>3.1.42.0</AssemblyVersion>'),
 ('installer/EvoluFisico.iss','#define MyAppVersion "3.1.42"')):
    assert token in (ROOT/path).read_text(encoding='utf-8'), path
assert 'M12 6a4 4 0 0 0-7.4-1.7' in html, 'Updated Análises icon missing'
assert '<<<<<<<' not in html and '>>>>>>>' not in html
print('PASS: Web 3.1.42 pinned at '+SOURCE+', native EFNativeStorage and Windows version parity.')
