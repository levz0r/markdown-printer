# Publishing Guide

This guide explains how to automatically publish Markdown Printer to Chrome Web Store, Firefox Add-ons, and Edge Add-ons using GitHub Actions.

## How It Works

The workflow (`publish.yml`) automatically:

1. Checks the current published version on each store
2. Compares it with your local manifest version
3. **Only publishes to stores where the version is outdated**
4. Skips stores that are already up-to-date

This prevents unnecessary submissions and review delays!

## Setup

### 1. Install publish-browser-extension

```bash
pnpm add -D publish-browser-extension
```

### 2. Configure GitHub Secrets

Add these secrets to your repository at `Settings > Secrets and variables > Actions > Repository secrets`:

#### Chrome Web Store

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Chrome Web Store API
3. Create OAuth 2.0 credentials
4. Follow [this guide](https://developer.chrome.com/docs/webstore/using-api) to get:
   - `CHROME_CLIENT_ID`
   - `CHROME_CLIENT_SECRET`
   - `CHROME_REFRESH_TOKEN`

#### Firefox Add-ons

1. Log in to [addons.mozilla.org](https://addons.mozilla.org/)
2. Go to **Tools > Manage API Keys**
3. Generate credentials:
   - `FIREFOX_ISSUER`
   - `FIREFOX_SECRET`

#### Microsoft Edge Add-ons

1. Sign in to [Partner Center](https://partner.microsoft.com/)
2. Visit the [Publish API page](https://partner.microsoft.com/en-us/dashboard/microsoftedge/publishapi)
3. Click **Create API credentials**:
   - `EDGE_PRODUCT_ID` (from your extension overview page)
   - `EDGE_CLIENT_ID`
   - `EDGE_CLIENT_SECRET`

## Usage

### Option 1: Manual Trigger

1. Go to `Actions` tab in GitHub
2. Select `Publish Extensions` workflow
3. Click `Run workflow`

The workflow will check all stores and only publish where needed.

### Option 2: Automatic on Tag

Create and push a version tag:

```bash
git tag v1.0.4
git push origin v1.0.4
```

The workflow will automatically run and publish to outdated stores.

## Version Management

### Update versions across all manifests

```bash
# Update version in package.json
npm version patch  # or minor, or major

# Manually update the version in:
# - extension-chrome/manifest.json
# - extension-firefox/manifest.json

# Build and commit
pnpm run build
git add .
git commit -m "Bump version to 1.0.4"
git tag v1.0.4
git push origin main --tags
```

## Workflow Output

The workflow provides a summary showing which stores were published to:

```
Publication Summary
- Chrome: ✓ Published
- Firefox: ⊘ Skipped (up to date)
- Edge: ⊘ Skipped (up to date)
```

## Troubleshooting

### Chrome: "Invalid refresh token"

Wait an hour after setting up the Chrome Web Store API before generating the refresh token.

### Firefox: "Submission failed"

Ensure you've zipped the source code correctly and that your extension follows AMO guidelines.

### Edge: "Authentication failed"

Verify your Product ID is correct by checking your extension's overview page in Partner Center.

### Version check fails

If the version check step fails, the workflow will still attempt to publish (using `continue-on-error: true`). Check the logs for details.

## Manual Publishing

If you prefer to publish manually, you can use the CLI directly:

```bash
# Publish to specific stores
npx publish-browser-extension \
  --chrome-zip dist/chrome.zip \
  --chrome-extension-id pfplfifdaaaalkefgnknfgoiabegcbmf \
  --chrome-client-id "$CHROME_CLIENT_ID" \
  --chrome-client-secret "$CHROME_CLIENT_SECRET" \
  --chrome-refresh-token "$CHROME_REFRESH_TOKEN"
```

## Notes

- First-time submissions must be done manually through each store's dashboard
- The workflow assumes you're using the same version for Chrome and Edge (both use extension-chrome)
- Source code is automatically zipped for Firefox submissions
- All submissions go through each store's review process before being published
