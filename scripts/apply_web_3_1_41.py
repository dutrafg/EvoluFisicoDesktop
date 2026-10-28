#!/usr/bin/env python3
"""Strict, idempotent port of pinned Web 3.1.41 onto the complete Windows frontend.
Keeps EFNativeStorage/SQLite protected data paths. Does not delete or migrate data.
"""
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]
WWW=ROOT/'src/EvoluFisico.Desktop/wwwroot'
HTML=WWW/'index.html'
PATCH=ROOT/'scripts/web-3.1.40-to-3.1.41-index.patch'
SOURCE='9754061d42879e10c9bebd32b3c9cb1eb9cbc615'
NATIVE=('EF_NATIVE_EVAL_PREFIX','window.EFNativeStorage','loadDirectoryNative',
        'ef-profile-professional','ef-profile-student-','EvoStore',
        'Perfil Unificado','Análises Completas','SQLite protegido')
def main():
    html=HTML.read_text(encoding='utf-8')
    assert len(html)>3_500_000,'Integral Web HTML missing'
    for marker in NATIVE: assert marker in html,'Missing native/full-Web marker: '+marker
    if '"version":"3.1.41"' not in html:
        assert '"version":"3.1.40"' in html,'Unexpected source Web version'
        patch=PATCH.read_text(encoding='utf-8')
        hunks=[x for x in re.split(r'(?=^@@ )',patch,flags=re.M) if x.startswith('@@ ')]
        assert len(hunks)==8,f'Expected 8 published hunks, found {len(hunks)}'
        blocks=[]
        for hunk in hunks:
            removed=[];added=[]
            def flush():
                if removed or added:
                    blocks.append(('\n'.join(removed),'\n'.join(added)))
                    removed.clear();added.clear()
            for line in hunk.splitlines()[1:]:
                if line.startswith('-'):removed.append(line[1:])
                elif line.startswith('+'):added.append(line[1:])
                else:flush()
            flush()
        assert len(blocks)==12,f'Expected 12 Web changes, found {len(blocks)}'
        for old,new in blocks:
            if not old or html.count(old)!=1:
                raise RuntimeError(f'Cannot apply Web diff exactly ({html.count(old)} matches): {old[:120]!r}')
            html=html.replace(old,new,1)
        HTML.write_text(html,encoding='utf-8')
    for marker in NATIVE: assert marker in html,'Native bridge lost: '+marker
    for marker in ('"version":"3.1.41"','Versão 3.1.41 Release',
                   "event.target.closest('button.eft-theme-option[data-eft-theme]')",
                   "document.querySelectorAll('#tab-painel, .top-navbar, #ef-workspace-heading')"):
        assert marker in html,'Web 3.1.41 feature missing: '+marker
    assert '<<<<<<<' not in html and '>>>>>>>' not in html
    for relative in ('src/EvoluFisico.Desktop/MainWindow.xaml.cs',
                     'src/EvoluFisico.Desktop/EvoluFisico.Desktop.csproj',
                     'installer/EvoluFisico.iss'):
        path=ROOT/relative
        content=path.read_text(encoding='utf-8')
        if '3.1.40' in content:path.write_text(content.replace('3.1.40','3.1.41'),encoding='utf-8')
        assert '3.1.40' not in path.read_text(encoding='utf-8'),relative
    sw=WWW/'sw.js'
    sw.write_text(sw.read_text(encoding='utf-8').replace('3.1.40','3.1.41'),encoding='utf-8')
    manifest=WWW/'manifest.webmanifest'
    data=json.loads(manifest.read_text(encoding='utf-8'))
    data['version']='3.1.41'
    data['name']='EvoluFísico Desktop 3.1.41'
    manifest.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    version=WWW/'version.json'
    data=json.loads(version.read_text(encoding='utf-8'))
    data.update(version='3.1.41',desktop_channel='RC',source_web_commit=SOURCE)
    version.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('PASS: Web 3.1.41, full native Windows HTML and all release identifiers synchronized.')
if __name__=='__main__':main()
