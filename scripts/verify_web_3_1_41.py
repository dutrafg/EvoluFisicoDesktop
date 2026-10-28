#!/usr/bin/env python3
"""Verify pinned Web 3.1.41 release, full Windows HTML and protected SQLite bridge."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
WWW=ROOT/'src/EvoluFisico.Desktop/wwwroot'
VERSION='3.1.41'
SOURCE='9754061d42879e10c9bebd32b3c9cb1eb9cbc615'
html=(WWW/'index.html').read_text(encoding='utf-8')
version=json.loads((WWW/'version.json').read_text(encoding='utf-8'))
manifest=json.loads((WWW/'manifest.webmanifest').read_text(encoding='utf-8'))
patch=(ROOT/'scripts/web-3.1.40-to-3.1.41-index.patch').read_text(encoding='utf-8')
assert len(html)>3_600_000 and len(patch)>10_000
assert version['version']==VERSION and version['source_web_commit']==SOURCE
assert version['desktop_channel']=='RC' and manifest['version']==VERSION
for marker in ('"version":"3.1.41"', 'Versão 3.1.41 Release',
               'EvoStore','Perfil Unificado','Análises Completas',
               'EF_NATIVE_EVAL_PREFIX','window.EFNativeStorage',
               'loadDirectoryNative','ef-profile-professional',
               'ef-profile-student-','SQLite protegido',
               "button.eft-theme-option[data-eft-theme]",
               "document.querySelectorAll('#tab-painel, .top-navbar, #ef-workspace-heading')"):
    assert marker in html, f'Missing Web 3.1.41/native marker: {marker}'
for path,token in (
 ('src/EvoluFisico.Desktop/MainWindow.xaml.cs','CurrentVersion = "3.1.41"'),
 ('src/EvoluFisico.Desktop/EvoluFisico.Desktop.csproj','<AssemblyVersion>3.1.41.0</AssemblyVersion>'),
 ('installer/EvoluFisico.iss','#define MyAppVersion "3.1.41"')):
    assert token in (ROOT/path).read_text(encoding='utf-8'), path
assert '<<<<<<<' not in html and '>>>>>>>' not in html
print('PASS: Web 3.1.41 pinned at '+SOURCE+', native EFNativeStorage and Windows version parity.')
