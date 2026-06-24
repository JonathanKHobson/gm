#!/usr/bin/env python3
"""Wrapper for the Node Playwright Story Modes browser QA."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
NODE = Path("/Users/kyle/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node")
SCRIPT = Path(__file__).with_suffix(".cjs")


def main() -> int:
    if not NODE.exists():
        print(f"Missing bundled Node executable: {NODE}", file=sys.stderr)
        return 1
    if not SCRIPT.exists():
        print(f"Missing browser QA script: {SCRIPT}", file=sys.stderr)
        return 1
    env = os.environ.copy()
    env.setdefault("NODE_PATH", "/Users/kyle/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules")
    return subprocess.run([str(NODE), str(SCRIPT)], cwd=str(ROOT), env=env, check=False).returncode


if __name__ == "__main__":
    raise SystemExit(main())
