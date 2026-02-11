# Release Guide — @sai360/n8n-nodes-grc

## Prerequisites

- Node.js v20+
- npm logged in (`npm whoami`)
- An npm **automation** access token with publish permissions and 2FA bypass for `@sai360` scope
  - Create at: https://www.npmjs.com/settings/antonlissone/tokens
  - Token type: **Granular Access Token** with 2FA bypass enabled (or **Automation** token)
- `GITHUB_TOKEN` env var set (optional, for automated GitHub Releases)

## Release Process

### 1. Ensure clean working directory

```bash
git status
```

All changes must be committed. `dist/` is in `.gitignore` and should not be tracked.

### 2. Run lint and build

```bash
npm run lint
npm run build
```

### 3. Bump version with release-it

The `n8n-node release` command wraps `release-it` but requires an interactive terminal. To run non-interactively, use `release-it` directly:

```bash
# Replace "patch" with "minor" or "major" as needed
export RELEASE_MODE=true && npx release-it patch -n \
  --no-git.requireCleanWorkingDir \
  --git.requireBranch=main \
  --git.requireUpstream \
  --git.requireCommits \
  --git.commit \
  --git.tag \
  --git.push \
  "--git.changelog=npx auto-changelog --stdout --unreleased --commit-limit false -u --hide-credit" \
  --github.release \
  "--hooks.before:init=npm run lint && npm run build" \
  "--hooks.after:bump=npx auto-changelog -p" \
  --no-npm.publish
```

> **Note:** We pass `--no-npm.publish` to skip the publish step in release-it and handle it separately (see step 4). This avoids the `prepublishOnly` hook issue.

Alternatively, if running interactively in a real terminal:

```bash
npm run release
```

### 4. Publish to npm

```bash
export RELEASE_MODE=true && npm publish --access public --//registry.npmjs.org/:_authToken=YOUR_NPM_TOKEN
```

Key flags:

- `RELEASE_MODE=true` — bypasses the `prepublishOnly` guard (`n8n-node prerelease`)
- `--access public` — required because `@sai360` is a scoped package; npm defaults scoped packages to private (402 error without this)
- `--//registry.npmjs.org/:_authToken=...` — automation token that bypasses 2FA

### 5. Push to GitHub (if not done by release-it)

```bash
git push && git push --tags
```

## Quick Release (All-in-One)

For a patch release from a clean working directory on `main`:

```bash
# 1. Build and bump version
npm run lint && npm run build
npm version patch
npx auto-changelog -p
git add -A && git commit -m "Release $(node -p 'require(\"./package.json\").version')"
git tag "$(node -p 'require(\"./package.json\").version')"

# 2. Publish
export RELEASE_MODE=true && npm publish --access public --//registry.npmjs.org/:_authToken=YOUR_NPM_TOKEN

# 3. Push
git push && git push --tags
```

## Troubleshooting

### `Working dir must be clean` error

The build step regenerates `dist/` files. Since `dist/` is in `.gitignore`, this shouldn't cause issues. If other files are dirty, commit or stash them first.

### `prepublishOnly` hook blocks `npm publish`

The `prepublishOnly` script runs `n8n-node prerelease`, which exits with code 1 unless `RELEASE_MODE=true` is set in the environment. Always export this var before publishing:

```bash
export RELEASE_MODE=true
```

### `E403 Two-factor authentication required`

Your npm token doesn't have 2FA bypass. Create a new **Granular Access Token** or **Automation** token at https://www.npmjs.com/settings/antonlissone/tokens with the 2FA bypass option enabled.

### `E402 Payment Required — You must sign up for private packages`

You forgot `--access public`. Scoped packages (`@sai360/...`) default to private on npm.

## n8n Community Node Status

### Self-Hosted

The node is installable immediately on self-hosted n8n instances via npm.

### n8n Cloud

Requires verification by n8n. Submit at:
https://docs.n8n.io/integrations/creating-nodes/deploy/submit-community-nodes/

Verification requirements:

- Package name starts with `n8n-nodes-` or `@<scope>/n8n-nodes-` ✅
- Keyword `n8n-community-node-package` in package.json ✅
- `n8n` attribute with nodes/credentials paths in package.json ✅
- `"strict": true` in `n8n` config (required for Cloud eligibility) ✅
- Built/linted with `@n8n/node-cli` ✅

## Project Configuration Notes

- `dist/` is in `.gitignore` — build artifacts are not tracked in git
- `package.json` has `"files": ["dist"]` — npm includes `dist/` in the published tarball from the local build output
- The `n8n-node release` CLI wrapper does not accept arguments (no `--ci`, no increment) — use `release-it` directly for non-interactive releases
