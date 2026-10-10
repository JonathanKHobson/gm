# GameMasterKyle maintenance

Read README.md and docs/project-map.md. This repository owns public site source; private campaign preparation is a separate input and must not be copied wholesale.

- Edit campaign-specific pages in their own route folders. Keep shared presentation in styles/, scripts/ and templates/.
- After header/footer changes, run `python3 tools/render-site-shell.py`, then `python3 tools/render-site-shell.py --check`. The renderer owns its explicit route set, not every HTML file in the archive.
- scripts/public-events.js owns listed events. Venue pages own booking and availability; do not infer seats or turn tentative dates into confirmed booking links.
- Preserve g → gm/links.html compatibility, player resources, existing downloads, and generated Atlas boundaries.
- Verify affected routes on desktop and mobile, relevant links and forms, and the actual Pages deployment after pushing. Keep unrelated changes and private source material out of the commit.
