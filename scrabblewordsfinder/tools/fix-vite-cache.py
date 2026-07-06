#!/usr/bin/env python3
"""
fix-vite-cache.py — Kill dev server, nuke stale Vite cache, restart.

Fixes the "file does not exist in optimize deps directory" error that occurs
when Vite's SSR dependency cache goes stale after dependency updates or crashes.

Usage:
    python3 tools/fix-vite-cache.py

What it does:
    1. Kills any process on port 4321 (the SWF dev server)
    2. Deletes node_modules/.vite/ (Vite's deps optimization cache)
    3. Restarts the dev server with `npm run dev`
"""

import os
import shutil
import signal
import subprocess
import sys
import time

PORT = 4321
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VITE_CACHE = os.path.join(PROJECT_DIR, "node_modules", ".vite")


def kill_port(port: int) -> bool:
    """Kill all processes listening on the given port. Returns True if any were killed."""
    try:
        result = subprocess.run(
            ["lsof", "-ti", f":{port}"],
            capture_output=True, text=True
        )
        pids = result.stdout.strip().split("\n")
        pids = [p for p in pids if p]
        if not pids:
            return False
        for pid in pids:
            try:
                os.kill(int(pid), signal.SIGTERM)
            except (ProcessLookupError, ValueError):
                pass
        print(f"  Killed {len(pids)} process(es) on port {port}")
        return True
    except Exception as e:
        print(f"  Warning: could not check port {port}: {e}")
        return False


def nuke_vite_cache() -> bool:
    """Delete the .vite cache directory. Returns True if it existed."""
    if os.path.isdir(VITE_CACHE):
        shutil.rmtree(VITE_CACHE)
        print(f"  Deleted {VITE_CACHE}")
        return True
    else:
        print(f"  No .vite cache found (already clean)")
        return False


def restart_dev_server():
    """Start the dev server in the background."""
    print(f"  Starting dev server...")
    subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=PROJECT_DIR,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True
    )
    # Wait for it to come up
    for i in range(30):
        time.sleep(1)
        try:
            result = subprocess.run(
                ["lsof", "-ti", f":{PORT}"],
                capture_output=True, text=True
            )
            if result.stdout.strip():
                print(f"  Dev server running at http://localhost:{PORT}")
                return True
        except Exception:
            pass
    print(f"  Warning: dev server did not start within 30s — check manually")
    return False


def main():
    print("fix-vite-cache: Fixing stale Vite dependency cache\n")

    print("[1/3] Stopping dev server...")
    killed = kill_port(PORT)
    if killed:
        time.sleep(1)  # Let processes clean up
    else:
        print("  No dev server running")

    print("[2/3] Nuking Vite cache...")
    nuke_vite_cache()

    print("[3/3] Restarting dev server...")
    restart_dev_server()

    print("\nDone. Vite will rebuild its dependency cache on first request.")


if __name__ == "__main__":
    main()
