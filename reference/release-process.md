# Release process

This guide walks the maintainer through cutting a release.

## Pre-tag checklist

Before tagging, on `main` with a clean working tree:

1. **Verify the unit suite is green:**
   ```bash
   npx tsc --build --force && NODE_OPTIONS=--experimental-vm-modules npm test
   ```

2. **Verify the audit is clean:**
   ```bash
   npm run audit:endpoints
   ```
   Exits 0. MISSING and DRIFT counts both 0.

3. **Verify examples are present:**
   ```bash
   npm run check:examples
   ```

4. **Run a full smoke sweep against the live instance:**
   ```bash
   npm run smoke
   ```
   All suites green.

5. **Local pack rehearsal:**
   ```bash
   npm run pack:local
   mkdir -p /tmp/pega-rehearsal
   tar -xzf dist/pega-v*-$(node -p process.platform)-$(node -p process.arch).tar.gz -C /tmp/pega-rehearsal
   /tmp/pega-rehearsal/pega/bin/pega --version
   /tmp/pega-rehearsal/pega/bin/pega auth ping
   rm -rf /tmp/pega-rehearsal
   ```
   Confirms the packed binary works end-to-end.

6. **Verify CHANGELOG entry exists for the target version:**
   ```bash
   grep -n "^## \[1\.0\.0\]" CHANGELOG.md
   ```

7. **Verify `package.json` version matches the target tag.**

## Cutting the tag

```bash
git tag v1.0.0
git push origin v1.0.0
```

Pushing the tag triggers `.github/workflows/release.yml`. Monitor it under the Actions tab.

## Post-tag verification

1. Wait for the workflow to complete (15-20 min).
2. Open the [Releases page](https://github.com/pknoetze/pega-dx-cli/releases) and verify:
   - Release named `v1.0.0` exists.
   - Body matches the `CHANGELOG.md` `[1.0.0]` section.
   - 7 assets attached: 5 tarballs + 1 zip + SHA256SUMS.
   - For pre-releases (`-rc.N`, `-beta.N`, `-alpha.N`), confirm the "Pre-release" badge is shown.
3. Download one tarball, extract, run `--version`. Confirm correct.

## npm publish

The release workflow does **not** publish to npm. After the tag is live:

```bash
npm publish
```

(Requires npm login + maintainer permissions on the `pega-dx-cli` package.)

## Tag redo (if workflow fails)

If the workflow fails before the Release is created:

```bash
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
# Fix the issue on main
git tag v1.0.0
git push origin v1.0.0
```

If the workflow created the Release but artefacts are wrong, delete the GitHub Release (UI) and re-tag as above.

## Pre-release flow

For pre-release tags like `v1.0.0-rc.1`:

```bash
git tag v1.0.0-rc.1
git push origin v1.0.0-rc.1
```

The workflow auto-detects `-rc.N` / `-beta.N` / `-alpha.N` suffixes and marks the GitHub Release as pre-release, so users running `/releases/latest/download/...` install one-liners don't pick it up.
