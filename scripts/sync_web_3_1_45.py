#!/usr/bin/env python3
"""Port estrito de diffs publicados do Evolufisico2 3.1.42 -> 3.1.45.
O PWA de origem e privado: patches versionados permitem CI sem credenciais externas.
NUNCA migrar, fundir ou apagar alunos, SQLite, cofre, backups e IDs.
"""
from pathlib import Path
import json,re

ROOT=Path(__file__).resolve().parents[1]
WWW=ROOT/'src/EvoluFisico.Desktop/wwwroot'
OLD='3.1.42';NEW='3.1.45'
HEAD='2e80aa6220ebaaf9430e387e2f7cbde324f918de'
NATIVE=('EF_NATIVE_EVAL_PREFIX','window.EFNativeStorage','loadDirectoryNative',
        'ef-profile-professional','ef-profile-student-','EvoStore',
        'Perfil Unificado','Análises Completas','SQLite protegido')

def patch_edits(src):
    hunks=re.split(r'(?=^@@ )',src,flags=re.M)
    for h in hunks:
        if not h.startswith('@@ '):continue
        lines=h.splitlines(keepends=True)[1:]
        i=0
        while i<len(lines):
            if not lines[i].startswith(('+','-')):i+=1;continue
            first=i;rm=[];ad=[]
            while i<len(lines) and lines[i].startswith(('+','-')):
                line=lines[i]
                if line.startswith('+'):ad.append(line[1:])
                else:rm.append(line[1:])
                i+=1
            # Context is only the lines immediately adjacent within this hunk.
            prior=[];k=first-1
            while k>=0 and lines[k].startswith(' '):
                prior.insert(0,lines[k][1:]);k-=1
            later=[];k=i
            while k<len(lines) and lines[k].startswith(' '):
                later.append(lines[k][1:]);k+=1
            yield ''.join(rm),''.join(ad),prior,later

def unique_pos(text,context,direction):
    if not context:return None
    for n in (2,3,4,6,8,12):
        sample=''.join(context[-n:] if direction=='after' else context[:n])
        if sample and text.count(sample)==1:
            p=text.index(sample)
            return p+len(sample) if direction=='after' else p
    return None

def apply_patch(content,patch,name):
    done=0;total=0
    for before,after,prior,later in patch_edits(patch):
        total+=1
        if before:
            found=content.count(before)
            if found==1:
                content=content.replace(before,after,1);done+=1
            elif found==0 and after and content.count(after)==1:
                print('Already applied',name,total)
            elif found>1:
                # Ex.: window.print() aparece em mais de um relatorio.
                # Aplicar apenas na ocorrencia com contexto vizinho exato.
                candidates=[]
                start=0
                while True:
                    pos=content.find(before,start)
                    if pos<0:break
                    ptxt=''.join(prior)
                    ntxt=''.join(later)
                    left=(not ptxt or content[:pos].endswith(ptxt))
                    right=(not ntxt or content[pos+len(before):].startswith(ntxt))
                    if left and right:candidates.append(pos)
                    start=pos+1
                if len(candidates)!=1:
                    raise RuntimeError(f'{name}: unresolved repeated edit #{total}, candidates={len(candidates)}')
                pos=candidates[0]
                content=content[:pos]+after+content[pos+len(before):]
                done+=1
            else:
                raise RuntimeError(f'{name}: conflicting change #{total}; old={found}, new={content.count(after)}, excerpt={before[:120]!r}')
        elif after:
            if after in content:continue
            pre=unique_pos(content,prior,'after')
            post=unique_pos(content,later,'before')
            if pre is None and post is None:
                raise RuntimeError(f'{name}: no unique insert anchor #{total}: {after[:120]!r}')
            if pre is not None and post is not None and pre>post:
                raise RuntimeError(f'{name}: contradictory anchors #{total}')
            p=post if post is not None else pre
            content=content[:p]+after+content[p:];done+=1
    assert total>=1, f'No patches: {name}'
    print(f'{name}: {done}/{total} patch blocks applied')
    return content


def port_native_runtime(content,patch):
    """Integra o PDF 3.1.45 sem descartar a previa cancelavel do WebView2."""
    added=''.join(line[1:] for line in patch.splitlines(keepends=True)
                  if line.startswith('+') and not line.startswith('+++'))
    start='        async function aguardarFotosDaImpressao(wrapper) {'
    stop='        async function imprimirAvaliacaoIndividualPDF(id) {'
    assert start in added and stop in added, 'Missing source image preloader'
    loader=added[added.index(start):added.index(stop)]
    marker='        function imprimirAvaliacaoIndividualPDF(id) {'
    assert content.count(marker)==1
    content=content.replace(marker,loader+marker,1)
    rows=[line[1:] for line in patch.splitlines(keepends=True)
          if line.startswith('+') and 'Coxa Esquerda:</td>' in line]
    assert len(rows)==2, f'Expected both left thigh measures: {len(rows)}'
    for row in rows:
        right=row.replace('Coxa Esquerda','Coxa Direita').replace('p.coxa_esq','p.coxa_dir')
        if content.count(right)!=1:raise RuntimeError('Missing/duplicated right thigh row in native PDF')
        if row not in content:content=content.replace(right,right+row,1)
    callback='abrirPreviaPDFDesktop(wrapper, aval, () => {'
    assert content.count(callback)==1, 'Native cancelable PDF preview missing'
    content=content.replace(callback,'abrirPreviaPDFDesktop(wrapper, aval, async () => {',1)
    location="                window.addEventListener('afterprint', cleanupIndPrint, { once: true });\n"
    assert content.count(location)==1, 'Native individual print callback changed unexpectedly'
    guard=(
        "                // Verifica fotos antes de solicitar impressao ao Windows.\n"
        "                const fotosProntas = await aguardarFotosDaImpressao(wrapper);\n"
        "                if (!fotosProntas) {\n"
        "                    cleanupIndPrint();\n"
        "                    (window.efToast || window.alert)('Uma fotografia nao carregou. Impressao cancelada para evitar PDF incompleto.', 'warn');\n"
        "                    return;\n"
        "                }\n"
    )
    content=content.replace(location,location+guard,1)
    assert "document.body.dataset.efPrintTarget = 'report';" in content
    assert "clearTimeout(window.__efPrintGuardTimer);" in content
    assert "window.print();" in content
    print('Native Windows PDF: 2 perimetry rows, photo preloader and cancelable preview preserved')
    return content

def main():
    html=WWW/'index.html'
    original=html.read_text(encoding='utf-8')
    assert len(original)>3_600_000 and '"version":"'+OLD+'"' in original,'Unexpected Desktop base'
    for marker in NATIVE:assert marker in original,'Missing native marker: '+marker
    patch_name='scripts/web-3.1.42-to-3.1.45-index.patch'
    patch=(ROOT/patch_name).read_text(encoding='utf-8')
    new=apply_patch(original,patch,patch_name)
    assert new!=original,'No Web HTML changes'
    html.write_text(new,encoding='utf-8')
    native=WWW/'assets/js/05-app-runtime.js'
    patch=(ROOT/'scripts/web-3.1.42-to-3.1.45-runtime.patch').read_text(encoding='utf-8')
    previous=native.read_text(encoding='utf-8')
    native.write_text(port_native_runtime(previous,patch),encoding='utf-8')
    css_patch=(ROOT/'scripts/web-3.1.42-to-3.1.45-print.patch').read_text(encoding='utf-8')
    css_extra=''.join(line[1:] for line in css_patch.splitlines(keepends=True)
                      if line.startswith('+') and not line.startswith('+++'))
    assert 'object-fit: contain' in css_extra,'Missing A4 fix'
    css=WWW/'assets/css/36-print-restore.css'
    current=css.read_text(encoding='utf-8')
    if css_extra not in current:
        css.write_text(current.rstrip()+'\n\n'+css_extra,encoding='utf-8')
    for path in ('src/EvoluFisico.Desktop/MainWindow.xaml.cs',
                 'src/EvoluFisico.Desktop/EvoluFisico.Desktop.csproj',
                 'installer/EvoluFisico.iss'):
        p=ROOT/path;data=p.read_text(encoding='utf-8')
        assert OLD in data,path
        p.write_text(data.replace(OLD,NEW),encoding='utf-8')
    sw=WWW/'sw.js';sw.write_text(sw.read_text(encoding='utf-8').replace(OLD,NEW),encoding='utf-8')
    manifest=WWW/'manifest.webmanifest'
    data=json.loads(manifest.read_text(encoding='utf-8'))
    data.update(version=NEW,name='EvoluFísico Desktop '+NEW)
    manifest.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    version=WWW/'version.json';data=json.loads(version.read_text(encoding='utf-8'))
    data.update(version=NEW,desktop_channel='RC',source_web_commit=HEAD)
    version.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    updated=html.read_text(encoding='utf-8')
    required=NATIVE+('"version":"'+NEW+'"','Coxa Esquerda:</td>',
        'async function aguardarFotosDaImpressao(wrapper)',
        'await aguardarFotosDaImpressao(wrapper)','if(review&&slots.size>1)',
        'id="ef-pdf-a4-hotfix"','workerChanged||newerThan')
    for m in required:assert m in updated,'Missing 3.1.45/native feature: '+m
    assert '<<<<<<<' not in updated and '>>>>>>>' not in updated
    print('PASS: Desktop Web 3.1.45; SQLite, WebView2, IDs and backups preserved')

if __name__=='__main__':main()
