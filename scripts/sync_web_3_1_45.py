#!/usr/bin/env python3
"""Sincronizacao verificavel Web 3.1.42 -> 3.1.45 no Desktop nativo.
Nunca substitui banco SQLite, cofre, backups ou IDs. Aborta em caso de divergencia.
"""
from pathlib import Path
import difflib, json, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
WWW=ROOT/'src/EvoluFisico.Desktop/wwwroot'
BASE='f133ce6cf8db85dbe239615639837c7ec89e4615'
HEAD='2e80aa6220ebaaf9430e387e2f7cbde324f918de'
OLD='3.1.42'; NEW='3.1.45'
NATIVE=('EF_NATIVE_EVAL_PREFIX','window.EFNativeStorage','loadDirectoryNative',
        'ef-profile-professional','ef-profile-student-','EvoStore',
        'Perfil Unificado','Análises Completas','SQLite protegido')

def show(repo,rev,path):
    return subprocess.run(['git','-C',str(repo),'show',rev+':'+path],
                          capture_output=True,check=True).stdout.decode('utf-8')

def anchor(text,lines,pos,after):
    for n in (2,3,4,5,6,8,12,20):
        a=''.join(lines[max(0,pos-n):pos] if after else lines[pos:pos+n])
        if a and text.count(a)==1:
            k=text.index(a)
            return k+len(a) if after else k
    return None

def port(text,base,current,name):
    if base==current:return text
    a=base.splitlines(keepends=True);b=current.splitlines(keepends=True)
    edits=[x for x in difflib.SequenceMatcher(a=a,b=b).get_opcodes() if x[0]!='equal']
    done=0
    for typ,i1,i2,j1,j2 in edits:
        old=''.join(a[i1:i2]);new=''.join(b[j1:j2])
        if old:
            n=text.count(old)
            if n==1:text=text.replace(old,new,1);done+=1
            elif n==0 and new and text.count(new)==1:continue
            else:raise RuntimeError(f'{name}: ambiguous block at {i1+1}, old={n}, new={text.count(new)}: {old[:95]!r}')
        elif new:
            if text.count(new)==1:continue
            pre=anchor(text,a,i1,True);post=anchor(text,a,i1,False)
            if pre is None and post is None:raise RuntimeError(f'{name}: no insertion anchor at {i1+1}')
            if pre is not None and post is not None and pre>post:
                raise RuntimeError(f'{name}: contradictory anchors at {i1+1}')
            k=post if post is not None else pre
            text=text[:k]+new+text[k:];done+=1
    print(name,'edits applied:',done)
    return text

def main():
    if len(sys.argv)!=2:raise SystemExit('Usage: sync_web_3_1_45.py <Evolufisico2 clone>')
    upstream=Path(sys.argv[1]).resolve()
    rev=subprocess.check_output(['git','-C',str(upstream),'rev-parse','HEAD'],text=True).strip()
    assert rev==HEAD,f'Unexpected upstream {rev}'
    html=WWW/'index.html'
    previous=html.read_text(encoding='utf-8')
    assert len(previous)>3600000 and '"version":"'+OLD+'"' in previous,'Unexpected Desktop RC-13 base'
    for s in NATIVE:assert s in previous,'Native marker absent: '+s
    for origin,dest in (
        ('index.html',html),
        ('assets/js/05-app-runtime.js',WWW/'assets/js/05-app-runtime.js')):
        before=show(upstream,BASE,origin);after=show(upstream,HEAD,origin)
        content=dest.read_text(encoding='utf-8')
        result=port(content,before,after,origin)
        if content==result:raise RuntimeError('No edits integrated: '+origin)
        dest.write_text(result,encoding='utf-8')
    # O HTML Windows ja integra o motor de historico inline. Nao carregar outro
    # overlay (o script externo repetiria MutationObserver e handlers).
    css0=show(upstream,BASE,'assets/css/30-print-restore.css')
    css1=show(upstream,HEAD,'assets/css/30-print-restore.css')
    assert css1.startswith(css0),'Unexpected upstream print CSS rewrite'
    addition=css1[len(css0):]
    css=WWW/'assets/css/36-print-restore.css'
    text=css.read_text(encoding='utf-8')
    if addition and addition not in text:
        css.write_text(text.rstrip()+'\n\n'+addition,encoding='utf-8')
    for name in ('src/EvoluFisico.Desktop/MainWindow.xaml.cs',
                 'src/EvoluFisico.Desktop/EvoluFisico.Desktop.csproj',
                 'installer/EvoluFisico.iss'):
        p=ROOT/name;s=p.read_text(encoding='utf-8')
        assert OLD in s,name
        p.write_text(s.replace(OLD,NEW),encoding='utf-8')
    sw=WWW/'sw.js';sw.write_text(sw.read_text(encoding='utf-8').replace(OLD,NEW),encoding='utf-8')
    manifest=WWW/'manifest.webmanifest'
    data=json.loads(manifest.read_text(encoding='utf-8'))
    data.update(version=NEW,name='EvoluFísico Desktop '+NEW)
    manifest.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    version=WWW/'version.json';data=json.loads(version.read_text(encoding='utf-8'))
    data.update(version=NEW,desktop_channel='RC',source_web_commit=HEAD)
    version.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    result=html.read_text(encoding='utf-8')
    required=NATIVE+('"version":"'+NEW+'"','Coxa Esquerda:</td>',
        'async function aguardarFotosDaImpressao(wrapper)',
        'await aguardarFotosDaImpressao(wrapper)','if(review&&slots.size>1)',
        'id="ef-pdf-a4-hotfix"','workerChanged||newerThan')
    for s in required:assert s in result,'Missing expected fix/native feature: '+s
    assert '<<<<<<<' not in result and '>>>>>>>' not in result
    print('PASS: Web 3.1.45 ported with Windows WebView2, SQLite and identity protection preserved')

if __name__=='__main__':main()
