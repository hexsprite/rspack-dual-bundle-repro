# Title

[rspack] --full-app tests build both main and test server bundles, causing duplicate module execution

# Body

### Description

When running `meteor test --full-app` with rspack and `testModule.server` specified in package.json, the rspack plugin builds **two separate server bundles**:

1. Main server bundle (from `mainModule.server`)
2. Test server bundle (from `testModule.server`)

Each bundle has its own webpack runtime with separate module caches. When both execute, modules with side effects (like Mongo collection creation) run twice, causing errors like:

```
Error: There is already a collection named "links"
```

### Version Info

- **Meteor version:** 3.4-rc.1
- **OS:** macOS (also affects Linux)

### Expected Behavior

When `testModule.server` is specified, the rspack plugin should skip building the main server bundle. The test entry imports the app startup, so only the test bundle is needed.

### Actual Behavior

Both bundles are built:
```
[Rspack Build Server] compiled successfully   # <-- Main bundle (shouldn't exist)
[Rspack Test Server] compiled successfully    # <-- Test bundle
```

Both execute, causing duplicate side effects.

### Reproduction

https://github.com/hexsprite/rspack-dual-bundle-repro

```bash
git clone https://github.com/hexsprite/rspack-dual-bundle-repro
cd rspack-dual-bundle-repro
npm install

# Without rspack - WORKS
npm run test-no-rspack

# With rspack - FAILS
npm run test-rspack
```

### Suggested Fix

In `rspack_plugin.js`, the condition at line ~246 should check if `testClient` or `testServer` is specified:

```javascript
// Only build main bundle in eager mode (no testClient/testServer specified)
if (isMeteorAppTestFullApp() && !initialEntrypoints?.testClient && !initialEntrypoints?.testServer) {
  await runRspackBuild({ ... });
}
```
