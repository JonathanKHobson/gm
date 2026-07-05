# Export Self-Verify Report

Build timestamp: 2026-07-05T12:33:16
Source content hash: 6753a06c32e5dca07a19eb73

## Checklist

- Both Markdown and player-handout form for entities/scenes: pass
- Per-type archetypes: pass
- Conditional-section law: pass
- Low-ink tokens: pass
- disclosure_tier and featured flags: pass
- Prop-only clue handouts: pass (43 non-prop clues marked no handout)
- Manifest coverage: pass (455 entries)

## Ranked Prior-Pass Gaps Fixed

1. Human review tree was missing. Added `_index/`, `handouts/`, `markdown/`, `_featured/`, and `_contract/`.
2. Export files did not all carry a single inspectable build stamp and content hash. Added build metadata and visible/exported stamp sections.
3. Contract prop was not part of the export system. Added source-generated premium contract artifacts and AI-generated B&W PNG assets.
