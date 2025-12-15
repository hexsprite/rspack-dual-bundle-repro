# Rspack Dual Bundle Bug Reproduction

## The Bug

When running `meteor test --full-app` with rspack and `testModule.server` specified, the rspack plugin builds **two separate bundles**:

1. Main server bundle (from `mainModule.server`)
2. Test server bundle (from `testModule.server`)

Each bundle has its own webpack runtime with separate module caches. When both bundles import the same collection, it gets created twice, causing:

```
Error: There is already a collection named "links"
```

## To Reproduce

```bash
npm run test-app
```

You'll see in the output:
```
[Rspack Build Server] compiled successfully   # <-- Main bundle
[Rspack Test Server] compiled successfully    # <-- Test bundle (SHOULD NOT EXIST)
=== SERVER MAIN LOADED ===
Error: There is already a collection named "links"
```

## Expected Behavior

When `testModule.server` is specified, the rspack plugin should **skip building the main server bundle** because:

1. The test entry (`tests/server.ts`) imports the app startup
2. Building both bundles causes modules to execute twice
3. Side effects (like collection creation) fail on second execution

## The Fix

In `rspack_plugin.js`, the condition for building the main bundle should check if `testModule.server` is specified:

```javascript
// Only build main bundle in eager mode (no testClient/testServer specified)
if (isMeteorAppTestFullApp() && !initialEntrypoints?.testClient && !initialEntrypoints?.testServer) {
  await runRspackBuild({
    isTest: false,
    isTestLike: true,
    isServer: true,
    isClient: false,
  });
}
```

## Configuration

`package.json`:
```json
{
  "meteor": {
    "mainModule": {
      "client": "client/main.tsx",
      "server": "server/main.ts"
    },
    "testModule": {
      "client": false,
      "server": "tests/server.ts"
    }
  }
}
```

The test entry imports the app:
```typescript
// tests/server.ts
import '/server/main';  // This imports the app startup
```
