#!/usr/bin/env python3
"""Verify pinned Web 3.1.40 release, full Windows HTML and protected SQLite bridge."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
WWW=ROOT/'src/EvoluFisico.Desktop/wwwroot'
VERSION='3.1.40'
SOURCE='47aebc7b9ee29c9222243ce845765859ec10b9a7'
html=(WWW/'index.html').read_text(encoding='utf-8')
version=json.loads((WWW/'version.json').read_text(encoding='utf-8'))
manifest=json.loads((WWW/'manifest.webmanifest').read_text(encoding='utf-8'))
patch=(ROOT/'scripts/web-3.1.38-to-3.1.40-index.patch').read_text(encoding='utf-8')
assert len(html)>3_600_000 and len(patch)>10_000
assert version['version']==VERSION and version['source_web_commit']==SOURCE
assert version['desktop_channel']=='RC' and manifest['version']==VERSION
for marker in ('"version":"3.1.40"', 'Versão 3.1.40 Release',
               'EvoStore','Perfil Unificado','Análises Completas',
               'EF_NATIVE_EVAL_PREFIX','window.EFNativeStorage',
               'loadDirectoryNative','ef-profile-professional',
               'ef-profile-student-','SQLite protegido'):
    assert marker in html, f'Missing Web 3.1.40/native marker: {marker}'
for path,token in (
 ('src/EvoluFisico.Desktop/MainWindow.xaml.cs','CurrentVersion = "3.1.40"'),
 ('src/EvoluFisico.Desktop/EvoluFisico.Desktop.csproj','<AssemblyVersion>3.1.40.0</AssemblyVersion>'),
 ('installer/EvoluFisico.iss','#define MyAppVersion "3.1.40"')):
    assert token in (ROOT/path).read_text(encoding='utf-8'), path
assert '<<<<<<<' not in html and '>>>>>>>' not in html
print('PASS: Web 3.1.40 pinned at '+SOURCE+', native EFNativeStorage and Windows version parity.')
