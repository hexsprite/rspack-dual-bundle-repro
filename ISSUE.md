# Title

[rspack] --full-app tests should combine mainModule and testModule into single bundle

# Body

### Description

When running `meteor test --full-app` with rspack and `testModule.server` specified, rspack builds **two separate server bundles**:

1. Main server bundle (from `mainModule.server`)
2. Test server bundle (from `testModule.server`)

Each bundle has its own webpack runtime with separate module caches. When both execute, modules run twice, causing errors like:

```
Error: There is already a collection named "links"
```

### Expected Behavior (matches legacy bundler)

The legacy Meteor bundler creates **one bundle** where both `mainModule` and `testModule` are eager entry points **sharing the same module cache**.

From `tools/isobuild/package-source.js`:
- In `--full-app` mode, mainModule is NOT cleared (unlike `meteor test` without `--full-app`)
- Both mainModule and testModule are marked as eager entries in the **same bundle**
- Shared module cache means imports only execute once

Rspack should match this: **one bundle with both entry points sharing a single webpack runtime**.

### Actual Behavior

Two separate bundles with independent webpack runtimes:
```
[Rspack Build Server] compiled successfully   # Bundle 1: own __webpack_require__ cache
[Rspack Test Server] compiled successfully    # Bundle 2: own __webpack_require__ cache
```

Both bundles execute, each with their own module cache, causing duplicate side effects.

### Version Info

- **Meteor version:** 3.4-rc.1
- **OS:** macOS (also affects Linux)

### Reproduction

https://github.com/hexsprite/rspack-dual-bundle-repro

```bash
git clone https://github.com/hexsprite/rspack-dual-bundle-repro
cd rspack-dual-bundle-repro
npm install

# Without rspack - WORKS (legacy bundler, single bundle)
npm run test-no-rspack

# With rspack - FAILS (two bundles, duplicate execution)
npm run test-rspack
```

### Suggested Fix

Build one server bundle with both `mainModule.server` and `testModule.server` as entry points, sharing one webpack runtime. This matches the legacy bundler behavior where both entries coexist in the same bundle.
