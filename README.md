# Idlewick

A cosy idle RPG about gathering, crafting, fighting and restoring a village. Plain HTML, CSS and JavaScript. The browser game has no runtime package dependencies. The Steam desktop target uses Electron for Windows and macOS, with durable account-scoped saves and Steam Auto-Cloud configuration described in [desktop/STEAM.md](desktop/STEAM.md).

## Play

Open **[Play Idlewick.html](Play%20Idlewick.html)** after downloading or cloning this repository. This generated file includes the game and its fonts and works offline.

For the live development preview, run from the repository folder:

```sh
# macOS / Linux / Codex Cloud
python3 scripts/preview.py

# Windows
py scripts/preview.py
```

Open **http://127.0.0.1:8765/**. Refreshing rebuilds the same playable file from the source. In a cloud environment that requires an externally reachable preview listener, use `python3 scripts/preview.py --host 0.0.0.0` and its provided preview URL.

## Continue development in Codex Cloud

Choose this GitHub repository when creating a Codex Cloud environment. The normal checks need Node.js and Python 3; there are no application dependencies or API keys to configure.

Ask the new task to **read `AGENTS.md` and `HANDOFF.md` before continuing**. Those files preserve the current design requirements, implementation context and verification commands from the local project.

For a local Windows checkout instead:

```powershell
git clone https://github.com/lukeharkness94-cmd/idlewick.git
cd idlewick
py scripts/preview.py
```

Open the cloned folder in Codex to work on the source.

## Test and rebuild

```sh
node tests/regression.cjs
python3 scripts/package-game.py
```

On Windows, replace `python3` with `py`. The optional pixel-art rendering check, `node tests/art-smoke.cjs`, also needs the development package `@napi-rs/canvas`; it is not needed to play the game or run the engine checks.

## Move your hero between devices

Game progress is stored in the browser, separately from the code. In the game, use **Settings (the HUD gear button) → Save data → Download backup file** on the old device, then **Load from file** on the new one. Save files should stay private and are excluded from Git.

## Desktop and Steam

See [desktop/STEAM.md](desktop/STEAM.md) for Windows/macOS builds, Steam account isolation, save paths and the Steamworks Cloud rules. Run `node tests/desktop-storage.cjs` for file-storage checks. The real Steam App ID is intentionally unset; native builds and cross-device Cloud sync still need release configuration and target-platform validation.
