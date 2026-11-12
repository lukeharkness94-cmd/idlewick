# Steam desktop release target

Idlewick's shipping target is a Windows x64 build and a macOS universal build (Intel and Apple Silicon), with Steam Cloud progression shared between them. The standalone HTML is the offline browser development build, not the Steam deliverable.

## Build on the target OS

1. Rebuild the game from the repository root with `python3 scripts/package-game.py` (`py` on Windows).
2. In `desktop/`, run `npm ci`, then `npm start` for a local desktop preview.
3. Set the real game App ID in `desktop/steam-config.json`. `npm run start:steam` tests a running Steam client and the matching Steam account. Local preview uses a separate `local` save profile.
4. Run `npm run dist:win` on Windows or `npm run dist:mac` on macOS. The output in `release/` is the application payload for SteamPipe depots. The build guard rejects an unset App ID and the Spacewar test ID in release builds.
5. Sign Windows binaries and sign/notarize the macOS application with the project's release credentials. Test the universal Mac build on Intel and Apple Silicon. Those platform checks cannot be replaced by Linux browser tests.

Electron hosts exactly the same bundled game and embedded fonts. Renderer isolation remains enabled; only a fixed save-storage bridge is exposed. Steamworks runs in the main process. Its overlay helper is called without its optional 60 Hz repaint interval, so it does not limit the game's native refresh-rate animation timelines. Platform packaging needs no renderer-specific game fork.

## Save contract

Game saves keep the existing version-2 JSON schema. UTF-8 files are replaced atomically only after the new bytes have been flushed. A failed write leaves the previous file intact. Exit waits for the final save; failed writes let the player stay in the game and export a backup. Accounts cannot read each other's profile folders.

| OS | Persistent save directory |
| --- | --- |
| Windows | `%APPDATA%/Idlewick/saves/<64-bit Steam ID>/` |
| macOS | `~/Library/Application Support/Idlewick/saves/<64-bit Steam ID>/` |

The two synchronized files are `hero.json` and `backups.json`. Temporary atomic-write files are not synchronized. Development-only `local` profiles are never included in the Steam Cloud path. Browser progress can be transferred privately through the existing save export/import controls; it is not automatically migrated into a Steam account.

## Required Steamworks configuration

This repository cannot activate Cloud for an unconfigured Steam App ID. Before release, configure **Steam Auto-Cloud** for the real App ID in Steamworks:

- Set suitable per-user byte/file quotas (64 MiB and 16 files cover the two bounded save files).
- Configure one shared cross-platform file rule, using `WinAppDataRoaming` as the base root, relative path `Idlewick/saves/{64BitSteamID}`, file pattern `*.json`, non-recursive.
- Add the macOS root override `MacAppSupport` with the same relative path. The override must map to the same shared Cloud files; do not create unrelated Windows-only and macOS-only Cloud namespaces.
- Enable sync on launch/exit and Steam Cloud support for both supported operating systems. Let the Steam client present Cloud conflict choices; the game does not guess a winner or overwrite a newer file during launch.
- Configure the Windows executable and universal macOS app launch options/depots in SteamPipe. Replace the placeholder reverse-domain bundle identifier with the project's owned identifier before signing.

The application uses local files with **Auto-Cloud**, not a second competing Remote Storage API synchronization layer. Steam handles uploads, downloads and offline reconciliation. Actual cross-machine Cloud sync is not verified or enabled until the App ID, quotas and path rules are configured and tested in Steam.

## Release validation

`node tests/desktop-storage.cjs` verifies file writes, account isolation, backups, failed-write preservation and the shared Windows/macOS file contract. `node tests/regression.cjs` verifies both browser and desktop storage adapters and the existing game schema.

A release also needs a real two-machine test: save on Windows, exit through Steam, wait for Cloud upload, start on macOS and verify the same hero and offline progress; repeat in the other direction. Test offline play, Cloud disabled, conflict prompts, interrupted shutdown, a full disk, a second Steam account and both Mac architectures. Native binaries, signing, depots and Cloud behavior still require target-OS and Steamworks validation.
