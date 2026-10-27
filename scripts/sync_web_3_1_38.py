#!/usr/bin/env python3
"""Apply the exact published Web 3.1.38 diff to the full Windows Web frontend.

The Web repository may be private to the Windows GitHub Actions token.
The pinned GitHub diff is vendored as scripts/web-3.1.38-index.patch.
Only the six published HTML hunks are applied, preserving native EFNativeStorage.
"""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
WWW = ROOT / "src/EvoluFisico.Desktop/wwwroot"
VERSION = "3.1.38"
HEAD = "ecdfc44b29429da6eee15346965d45447f5b16f8"

def replace_text(path, old, new):
    content = path.read_text(encoding="utf-8")
    if old not in content:
        raise RuntimeError(f"Missing expected version token in {path}")
    path.write_text(content.replace(old, new), encoding="utf-8")

def apply_published_hunks(windows, patch):
    hunks = [h for h in re.split(r"(?=^@@ )", patch, flags=re.MULTILINE) if h.startswith("@@ ")]
    if len(hunks) != 6:
        raise RuntimeError(f"Expected 6 published HTML hunks, found {len(hunks)}")
    count = 0
    for hunk in hunks:
        lines = hunk.splitlines(keepends=True)[1:]
        removed, added = [], []
        def flush():
            nonlocal windows, count
            if not removed and not added:
                return
            old = "".join(removed)
            new = "".join(added)
            if old:
                occurrences = windows.count(old)
                if occurrences != 1:
                    raise RuntimeError(f"Cannot apply published Web replacement ({occurrences} matches): {old[:140]!r}")
                windows = windows.replace(old, new, 1)
            else:
                if 'id="ef-rebrand-138"' not in new or 'id="ef-large-monitor-card-density-139"' not in new:
                    raise RuntimeError("Unexpected Web insertion; refused to alter native HTML")
                position = windows.rfind("\\n</body>")
                if position < int(len(windows) * 0.90):
                    raise RuntimeError("Cannot locate final closing body for published CSS")
                windows = windows[:position] + "\\n" + new + windows[position:]
            count += 1
            removed.clear()
            added.clear()
        for line in lines:
            if line.startswith("-"):
                removed.append(line[1:])
            elif line.startswith("+"):
                added.append(line[1:])
            elif line.startswith(" ") or line.startswith("\\"):
                flush()
            else:
                raise RuntimeError(f"Unrecognized published patch line: {line[:120]!r}")
        flush()
    if count != 8:
        raise RuntimeError(f"Unexpected number of changed blocks: {count}")
    return windows

def main():
    html_path = WWW / "index.html"
    html = html_path.read_text(encoding="utf-8")
    assert len(html) > 3_500_000, "Integral Web frontend missing"
    for marker in ("EF_NATIVE_EVAL_PREFIX", "window.EFNativeStorage", "EvoStore", "Perfil Unificado", "Análises Completas"):
        assert marker in html, f"Native Windows integration missing: {marker}"
    patch = (ROOT / "scripts/web-3.1.38-index.patch").read_text(encoding="utf-8")
    html = apply_published_hunks(html, patch)
    for marker in ('"version":"3.1.38"', 'id="ef-rebrand-138"', 'id="ef-large-monitor-card-density-139"', "EF_NATIVE_EVAL_PREFIX", "window.EFNativeStorage", "EvoStore", "Perfil Unificado", "Análises Completas"):
        assert marker in html, f"Porting removed {marker}"
    assert "<<<<<<<" not in html and ">>>>>>>" not in html
    html_path.write_text(html, encoding="utf-8")
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
    (WWW / "version.json").write_text(json.dumps({
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
    assert f'CurrentVersion = "{VERSION}"' in (ROOT / "src/EvoluFisico.Desktop/MainWindow.xaml.cs").read_text(encoding="utf-8")
    assert f'<AssemblyVersion>{VERSION}.0</AssemblyVersion>' in (ROOT / "src/EvoluFisico.Desktop/EvoluFisico.Desktop.csproj").read_text(encoding="utf-8")
    assert f'#define MyAppVersion "{VERSION}"' in (ROOT / "installer/EvoluFisico.iss").read_text(encoding="utf-8")
    print(f"Ported published Web {VERSION} HTML diff, preserved full modules and native SQLite; source {HEAD}")

if __name__ == "__main__":
    main()
