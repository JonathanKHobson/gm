#!/usr/bin/env python3
"""QA gate for the Run Mode music player."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "story-atlas" / "src"
DIST = ROOT / "dist" / "story-atlas"
SOURCE_MANIFEST = SRC / "audio_assets" / "music_library.json"
REPORT = DIST / "data" / "qa-music-player-report.json"


def add(checks: list[dict[str, Any]], name: str, ok: bool, detail: object = "") -> None:
    checks.append({"name": name, "ok": bool(ok), "detail": detail if isinstance(detail, str) else json.dumps(detail, indent=2)})


def read_json(path: Path, fallback: Any) -> Any:
    if not path.exists():
        return fallback
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> None:
    checks: list[dict[str, Any]] = []
    source = read_json(SOURCE_MANIFEST, {})
    generated = read_json(DIST / "data" / "music-library.json", {})
    tracks = generated.get("tracks", [])
    playlists = generated.get("playlists", [])
    track_ids = [track.get("id") for track in tracks]
    playlist_ids = [playlist.get("id") for playlist in playlists]

    add(checks, "source music manifest exists", SOURCE_MANIFEST.exists(), str(SOURCE_MANIFEST))
    add(checks, "generated music library exists", (DIST / "data" / "music-library.json").exists(), "")
    add(checks, "music library has tracks", bool(tracks), len(tracks))
    add(checks, "music library has playlists", bool(playlists), len(playlists))
    add(checks, "track ids are unique", len(track_ids) == len(set(track_ids)), track_ids)
    add(checks, "playlist ids are unique", len(playlist_ids) == len(set(playlist_ids)), playlist_ids)
    add(checks, "default track exists", generated.get("defaultTrackId") in set(track_ids), generated.get("defaultTrackId"))
    add(checks, "default playlist exists", generated.get("defaultPlaylistId") in set(playlist_ids), generated.get("defaultPlaylistId"))

    missing_source = []
    missing_generated = []
    bad_track_paths = []
    for track in tracks:
        source_file = track.get("source_file", "")
        src = SRC / "audio_assets" / source_file
        runtime = DIST / str(track.get("src", ""))
        if not source_file or ".." in Path(source_file).parts:
            bad_track_paths.append({"track": track.get("id"), "source_file": source_file})
        if not src.exists():
            missing_source.append({"track": track.get("id"), "source_file": source_file})
        if not runtime.exists():
            missing_generated.append({"track": track.get("id"), "src": track.get("src")})

    add(checks, "track source paths are repo-relative and safe", not bad_track_paths, bad_track_paths[:10])
    add(checks, "all manifest tracks have local source files", not missing_source, missing_source[:10])
    add(checks, "all manifest tracks are copied into dist", not missing_generated, missing_generated[:10])

    unknown_playlist_refs = []
    known_tracks = set(track_ids)
    for playlist in playlists:
        for track_id in playlist.get("track_ids", []):
            if track_id not in known_tracks:
                unknown_playlist_refs.append({"playlist": playlist.get("id"), "track": track_id})
    add(checks, "playlists reference known tracks", not unknown_playlist_refs, unknown_playlist_refs[:10])

    source_tracks = source.get("tracks", []) if isinstance(source, dict) else []
    source_files = [track.get("source_file") for track in source_tracks]
    add(checks, "source manifest includes every generated track", len(source_tracks) == len(tracks), {"source": len(source_tracks), "generated": len(tracks)})
    add(checks, "source file entries are unique", len(source_files) == len(set(source_files)), source_files)

    run_html = (DIST / "run.html").read_text(encoding="utf-8", errors="ignore") if (DIST / "run.html").exists() else ""
    display_html = (DIST / "player-display.html").read_text(encoding="utf-8", errors="ignore") if (DIST / "player-display.html").exists() else ""
    music_js = (DIST / "js" / "music-player.js").read_text(encoding="utf-8", errors="ignore") if (DIST / "js" / "music-player.js").exists() else ""
    music_css = (DIST / "css" / "music-player.css").read_text(encoding="utf-8", errors="ignore") if (DIST / "css" / "music-player.css").exists() else ""

    add(checks, "run page loads music player assets", all(token in run_html for token in ["css/music-player.css", "data/music-library-data.js", "js/music-player.js", "data-music-player"]), "")
    add(checks, "Run Mode music panel starts collapsed", '<details class="music-player-panel" data-music-panel open' not in run_html, "")
    add(checks, "Run Mode music panel has compact summary", all(token in run_html for token in ["data-music-summary-now", "data-music-collapsed-label", "data-music-expanded-label"]), "")
    add(checks, "player display owns audio output", "data-music-audio" in display_html and "data-music-player" not in display_html, "")
    add(checks, "player display loads music player assets", all(token in display_html for token in ["css/music-player.css", "data/music-library-data.js", "js/music-player.js"]), "")
    add(checks, "Run Mode has no audio element", "data-music-audio" not in run_html and "<audio" not in run_html.lower(), "")
    add(checks, "music JS sends player-display control messages", all(token in music_js for token in ["musicPlay", "musicPause", "musicSetTrack", "musicSetVolume", "musicRestart", "GoldspireDisplaySync"]), "")
    add(checks, "music JS persists collapsed panel state", "goldspire-music-panel-open-v1" in music_js and "collapse-panel" in music_js, "")
    add(checks, "music JS closes overlay from Hide, outside click, and Escape", all(token in music_js for token in ["function setMusicPanelOpen", "pointerdown", 'event.key !== "Escape"', "collapse-panel"]), "")
    add(checks, "music JS stores playback status", "goldspire-music-playback-v1" in music_js and "audio-locked" in music_js, "")
    add(checks, "music CSS includes player unlock affordance", ".player-audio-unlock" in music_css, "")
    add(checks, "music expanded controls render as overlay sheet", all(token in music_css for token in [".music-player {", "position: absolute", "max-height: min(68vh, 32rem)", ".music-player-panel:not([open]) .music-player", "backdrop-filter: blur"]), "")

    REPORT.parent.mkdir(parents=True, exist_ok=True)
    issues = [check for check in checks if not check["ok"]]
    REPORT.write_text(json.dumps({"ok": not issues, "checks": checks}, indent=2, ensure_ascii=False), encoding="utf-8")
    for check in checks:
        status = "OK" if check["ok"] else "FAIL"
        print(f"{status}: {check['name']}")
        if not check["ok"] and check["detail"]:
            print(check["detail"])
    if issues:
        sys.exit(1)


if __name__ == "__main__":
    main()
