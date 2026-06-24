# Story Atlas Exports

This folder is the local front door for reviewing static Story Atlas exports without opening the Atlas app.

Build timestamp: 2026-06-23T21:40:58
Source content hash: dac3370046ed077140fab2d6
Entries in manifest: 446
Player handouts available: 403

## Start Here

- Review table-critical handouts first in `../handouts/_featured/`.
- Review the premium contract prop in `../handouts/_contract/`.
- Use `coverage-report.md` as the worklist for missing or intentionally skipped handouts.
- Whole-site context backups are copied here as `story-atlas-context.json` and `story-atlas-context.md`.

## Folder Map

- `../handouts/`: player-safe Printer HTML, PDF, DOCX, and JSON sidecars organized by wiki category.
- `../markdown/`: raw Markdown exports organized by wiki category for GM review, AI context, and backup.
- `export-manifest.json`: machine manifest for every generated target.
- `build-info.json`: timestamp, source hash, and regenerate command.

## Regenerate

Run `python3 story-atlas/src/build_atlas.py` from the repo root.

TODO: Future dynamic re-export pipeline can re-export only changed entities from source hashes. Do not build that dynamic path in this static export slice.

## Snapshot Health

- Missing markdown rows: 0
- Missing handout rows: 43
- Contract handout hash: 7e2c31ba7c91b7c6
