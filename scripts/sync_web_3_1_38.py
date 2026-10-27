#!/usr/bin/env python3
"""Port Web 3.1.38 HTML changes onto the integral Windows frontend, preserving EFNativeStorage."""
from pathlib import Path
import difflib
import json
import re
import subprocess
import tempfile
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
WWW = ROOT / "src/EvoluFisico.Desktop/wwwroot"
VERSION = "3.1.38"
BASE = "486ef975f97aff52388624c7edcd95089b66e9e7"
HEAD = "ecdfc44b29429da6eee15346965d45447f5b16f8"
REMOTE = "https://github.com/dutrafg/Evolufisico2.git"

def run(*cmd, cwd=None, check=True):
    return subprocess.run(cmd, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=check)

def git_web_sources(repo_dir):
    # Fetch immutable source revisions directly; no cross-repository git credentials required.
    result = []
    for sha in (BASE, HEAD):
        url = f"https://raw.githubusercontent.com/dutrafg/Evolufisico2/{sha}/index.html"
        with urlopen(Request(url, headers={"User-Agent": "EvoluFisicoDesktop-RC10"}), timeout=60) as response:
            body = response.read().decode("utf-8")
        if len(body) < 3_000_000:
            raise RuntimeError(f"Web source is incomplete: {sha}")
        result.append(body)
    return result

def patch_nonoverlapping(base, newest, windows):
    old_lines, new_lines = base.splitlines(keepends=True), newest.splitlines(keepends=True)
    edits = [x for x in difflib.SequenceMatcher(None, old_lines, new_lines, autojunk=False).get_opcodes() if x[0] != "equal"]
    for op, a, b, c, d in edits:
        old_chunk = "".join(old_lines[a:b])
        new_chunk = "".join(new_lines[c:d])
        if old_chunk:
            if windows.count(old_chunk) != 1:
                raise RuntimeError(f"Web diff {op} lines {a}-{b} cannot be mapped unambiguously to Windows HTML")
            windows = windows.replace(old_chunk, new_chunk, 1)
        else:
            # The only 3.1.38 insertion is the pair of CSS blocks immediately before </body>.
            if 'id="ef-rebrand-138"' not in new_chunk or 'id="ef-large-monitor-card-density-139"' not in new_chunk:
                raise RuntimeError(f"Unexpected Web insertion at line {a}")
            if windows.count("</body>") != 1:
                raise RuntimeError("Windows HTML has ambiguous closing body")
            windows = windows.replace("</body>", new_chunk + "</body>", 1)
    return windows

def replace_text(path, old, new):
    text = path.read_text(encoding="utf-8")
    if old not in text:
        raise RuntimeError(f"Missing version token in {path}")
    path.write_text(text.replace(old, new), encoding="utf-8")

def main():
    current = (WWW / "index.html").read_text(encoding="utf-8")
    assert len(current) > 3_500_000, "Integral Web frontend missing"
    for marker in ("EF_NATIVE_EVAL_PREFIX", "window.EFNativeStorage", "EvoStore", "Perfil Unificado", "Análises Completas"):
        assert marker in current, f"Missing Windows integration: {marker}"
    with tempfile.TemporaryDirectory(prefix="ef-web-") as temp:
        base, newest = git_web_sources(Path(temp) / "web")
        assert '"version":"3.1.38"' in newest, "Pinned Web source is not 3.1.38"
        p1, p2, p3 = (Path(temp) / name for name in ("windows.html", "base.html", "new.html"))
        for p, data in ((p1, current), (p2, base), (p3, newest)):
            p.write_text(data, encoding="utf-8")
        merged = run("git", "merge-file", "-p", str(p1), str(p2), str(p3), check=False)
        if merged.returncode == 0:
            html = merged.stdout.decode("utf-8")
            print("Applied Web 3.1.38 via clean three-way merge")
        else:
            print("Three-way merge conflicted; applying verified nonoverlapping Web diff")
            html = patch_nonoverlapping(base, newest, current)
    for marker in ("EF_NATIVE_EVAL_PREFIX", "window.EFNativeStorage", "EvoStore", "Perfil Unificado", "Análises Completas", 'id="ef-rebrand-138"', 'id="ef-large-monitor-card-density-139"', '"version":"3.1.38"'):
        assert marker in html, f"Web 3.1.38 merge lost {marker}"
    assert "<<<<<<<" not in html and ">>>>>>>" not in html
    assert len(html) > 3_500_000
    (WWW / "index.html").write_text(html, encoding="utf-8")
    for p in (
        ROOT / "src/EvoluFisico.Desktop/MainWindow.xaml.cs",
        ROOT / "src/EvoluFisico.Desktop/EvoluFisico.Desktop.csproj",
        ROOT / "installer/EvoluFisico.iss",
        ROOT / "tests/windows-full-web-3-1-37.cjs",
    ):
        replace_text(p, "3.1.37", VERSION)
    manifest_path = WWW / "manifest.webmanifest"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["version"] = VERSION
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    version_path = WWW / "version.json"
    version_path.write_text(json.dumps({
        "application": "EvoluFísico2",
        "version": VERSION,
        "channel": "Release",
        "desktop_channel": "RC",
        "source_web_commit": HEAD,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    sw_path = WWW / "sw.js"
    sw = sw_path.read_text(encoding="utf-8")
    if "3.1.37" in sw:
        sw_path.write_text(sw.replace("3.1.37", VERSION), encoding="utf-8")
    # The updater, assembly, installer and Web splash all share the exact numeric version.
    assert f'CurrentVersion = "{VERSION}"' in (ROOT / "src/EvoluFisico.Desktop/MainWindow.xaml.cs").read_text(encoding="utf-8")
    assert f'<AssemblyVersion>{VERSION}.0</AssemblyVersion>' in (ROOT / "src/EvoluFisico.Desktop/EvoluFisico.Desktop.csproj").read_text(encoding="utf-8")
    assert f'#define MyAppVersion "{VERSION}"' in (ROOT / "installer/EvoluFisico.iss").read_text(encoding="utf-8")
    print(f"Prepared full Web {VERSION} frontend with native SQLite bridge; source {HEAD}")

if __name__ == "__main__":
    main()
