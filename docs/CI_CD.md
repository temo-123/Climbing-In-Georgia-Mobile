# CI/CD — EAS Build & Play Store Submit

Documentation for the automated Android build/submit pipeline in the Climbing In Georgia React Native app.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Trigger & Inputs](#trigger--inputs)
- [Build Profiles](#build-profiles)
- [Required Secrets](#required-secrets)
- [Setting Up `EXPO_TOKEN`](#setting-up-expo_token)
- [Setting Up `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY`](#setting-up-google_play_service_account_key)
- [File Reference](#file-reference)
- [Local Equivalent](#local-equivalent)
- [Known Caveat: versionCode Drift](#known-caveat-versioncode-drift)
- [Troubleshooting](#troubleshooting)

---

## Overview

A GitHub Actions workflow builds the Android app on EAS's cloud build service and, optionally, submits it straight to the Google Play Console. It is **manual-only** — nothing runs on push or on a schedule. You trigger it from the GitHub Actions tab when a release is ready.

Every run produces two artifacts:
- **`.aab`** (production profile) — the format Google Play requires. Optionally auto-submitted to the **internal testing track** after it builds.
- **`.apk`** (production-apk profile) — same version as the `.aab`, for installing directly on a device without going through the Play Store.

Nothing is submitted to a **public** track automatically. Internal testing is a private track (testers you explicitly add in Play Console) — promoting a build to production/public release is still a manual step in Play Console.

---

## Architecture

```
GitHub Actions tab
      ↓ "Run workflow" (manual trigger)
.github/workflows/eas-build.yml
      ↓
  checkout → npm ci → setup EAS CLI (expo/expo-github-action, authenticated via EXPO_TOKEN)
      ↓
  write Google Play service account key to google-play-service-account.json
  (only if submit_to_play_store input is checked)
      ↓
  eas build --platform android --profile production --wait
      [--auto-submit-with-profile production]   ← if submit_to_play_store checked
      ↓                                                ↓
  builds .aab on EAS's cloud                    eas submit --profile production
                                                  (reads eas.json → serviceAccountKeyPath)
                                                        ↓
                                                 Play Console, internal testing track
      ↓
  eas build --platform android --profile production-apk --wait
      ↓
  builds .apk on EAS's cloud (same version, no re-increment)
      ↓
  remove the service account key file
```

---

## Trigger & Inputs

Workflow: **EAS Build & Submit (Android)**, event `workflow_dispatch` only.

To run it: GitHub repo → **Actions** tab → **EAS Build & Submit (Android)** → **Run workflow**.

| Input | Type | Default | Effect |
|-------|------|---------|--------|
| `submit_to_play_store` | boolean (checkbox) | `true` | If checked, the `.aab` build is followed by `eas submit` to the Play Store internal testing track. If unchecked, only the `.aab`/`.apk` are built — nothing is submitted, and the Google Play service account key is never written to disk. |

---

## Build Profiles

Defined in `eas.json`. The workflow uses `production` and `production-apk`; `development` and `preview` exist for local use (see [Local Equivalent](#local-equivalent)) and aren't part of the automated pipeline.

| Profile | Output | Version behavior | Used by workflow? |
|---------|--------|-------------------|--------------------|
| `development` | `.apk` (dev client) | — | No — local only |
| `preview` | `.apk` | — | No — local only |
| `production` | `.aab` (app bundle) | `autoIncrement: true` — bumps `versionCode` | Yes — this is what gets submitted |
| `production-apk` | `.apk` | `autoIncrement: false` — extends `production`, reuses its version | Yes — built right after, so it matches the `.aab` just built |

---

## Required Secrets

Set both as **repository secrets**: GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**.

| Secret name | Used for |
|-------------|----------|
| `EXPO_TOKEN` | Authenticates `eas-cli` in CI (no interactive `eas login`) |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY` | Lets `eas submit` upload the `.aab` to Play Console on your behalf |

Neither secret exists yet as of this writing — the workflow will fail at the relevant step until they're added.

---

## Setting Up `EXPO_TOKEN`

1. Go to [expo.dev](https://expo.dev) → your account → **Access Tokens** (directly: `https://expo.dev/accounts/<account>/settings/access-tokens`).
2. Create a new token and copy it — it's only shown once.
3. In GitHub: **Settings → Secrets and variables → Actions → New repository secret**, name it `EXPO_TOKEN`, paste the value.

---

## Setting Up `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY`

This one spans Google Cloud and Play Console:

1. In [Google Play Console](https://play.google.com/console) → **Setup → API access**, link (or create) a Google Cloud project if none is linked yet.
2. In that Cloud project's **IAM & Admin → Service Accounts**, create a service account (e.g. `eas-submit`).
3. On that service account, create a **JSON key** and download it.
4. Back in Play Console → **API access**, find the service account and grant it access to this app with at least **Release apps to testing tracks** (view app info is also needed) — internal-track-only permissions are sufficient since that's all this workflow uses.
5. Open the downloaded JSON file and copy its entire contents.
6. In GitHub: **Settings → Secrets and variables → Actions → New repository secret**, name it `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY`, paste the raw JSON.

At build time, the workflow writes this secret to `google-play-service-account.json` in the checkout (gitignored, deleted again at the end of the job). `eas.json`'s `submit.production.android.serviceAccountKeyPath` points at that same path, so `eas submit` picks it up automatically.

---

## File Reference

| File | Purpose |
|------|---------|
| `.github/workflows/eas-build.yml` | The workflow itself — trigger, steps, secrets usage |
| `eas.json` | Build profiles (`development`/`preview`/`production`/`production-apk`) and the `submit.production` config (track + service account key path) |
| `app.json` | `expo.version` (semver) and `expo.android.versionCode` — see [Known Caveat](#known-caveat-versioncode-drift) |
| `.gitignore` | Excludes `google-play-service-account.json` so a locally-run key file can't be committed by accident |

---

## Local Equivalent

Everything the workflow does can be run by hand — see the `README.md` **Build** section and `CLAUDE.md`:

```bash
npm install -g eas-cli
eas login

eas build -p android --profile production        # .aab, for Google Play submission (auto-increments version)
eas build -p android --profile production-apk     # .apk of the production build, same version, no auto-increment

eas submit -p android --profile production        # submit the most recent .aab to the internal testing track
```

---

## Known Caveat: versionCode Drift

`eas.json` has `"appVersionSource": "local"` and `production.autoIncrement: true`. That means EAS CLI bumps `android.versionCode` in `app.json` **inside the CI runner's checkout** as part of the build — it does not commit that change back to the repo. Over several runs, the `versionCode` actually used on Play Console can drift ahead of what's checked into git.

This predates the CI pipeline (it's how the project already handled local manual builds) and isn't something the workflow changes. Two ways to fix it going forward, neither implemented yet:
- Add a step to the workflow that commits the bumped `app.json` back to the repo after a successful build, or
- Switch `appVersionSource` to `"remote"` so EAS tracks the version counter on its own servers instead of in the repo.

---

## Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| Workflow fails at "Setup EAS CLI" | `EXPO_TOKEN` secret missing, expired, or revoked |
| `eas build` fails immediately, no logs | Wrong Expo project — check `extra.eas.projectId` in `app.json` matches the EAS project this token belongs to |
| Build succeeds but submit step fails with a permissions error | Service account in Play Console doesn't have "Release apps to testing tracks" for this app, or the Cloud project/service account isn't linked in Play Console's API access page |
| Submit step fails with "invalid JSON" / auth error | `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY` secret doesn't contain the full, valid JSON key file contents |
| `.apk` build uses an unexpected version | Expected — `production-apk` runs after `production` in the same job and intentionally reuses whatever version the `.aab` build just set (`autoIncrement: false`), so the two artifacts match |
