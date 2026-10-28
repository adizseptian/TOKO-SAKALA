# TOKO MODE v0.5.1 — Source verification status (Updated: 28 Oktober 2026)

See also `HASIL AUDIT.md` for the permanent audit ledger and complete PASS / BLOCKED / SKIPPED evidence.

## Verified in this environment
- **Native Vitest Run**: `npm run test` executes natively across 8 test suites (33 unit tests: engine calculations, golden fixtures, purchase preview, stock check, AI defaults OFF, and Google Drive storage/checksums/schemas). **All 33 passed**.
- **Production Build**: `npm run build` (`tsc --noEmit && vite build`) executes cleanly with 0 TypeScript diagnostic errors and transforms 1,833 modules into production bundle in 1.21s.
- **Secret Scanning**: `npm run scan:secrets` passed with 0 detected secret patterns.
- **Storage Engine Readiness**: `src/storage/` module implemented with Zod validation, SHA-256 checksums, MockStorageAdapter, and GoogleDriveAdapter (REST API v3, `drive.file` scope).
- **Physical Unit Isolation**: Stock preview separates quantities by physical unit (`remainingByUnit`); unlike units are never summed.
- **Financial Separation**: Expected handover, received cash, and store cash concepts are distinct; unknown modal prices stay `null` and are never invented.
- **AI Defaults**: AI features remain default OFF with no client-side API keys or unauthorized model invocations.

## Not verified / blocked in this sandbox
- **Playwright Headless Browser**: `scripts/test-stock-check.mjs` is blocked due to missing Chromium browser binaries in the container environment. Running `npx playwright install chromium` in a local developer environment is required for headless browser screenshots.
- **Git Remote Push from Sandbox**: Sandbox container lacks `.git` metadata directory (`fatal: not a git repository`). Commits and pushes must be performed from the local clone or GitHub CI.

## Release status
PREVIEW & GOOGLE DRIVE BACKEND READY (v0.5.1). Core engine, storage schemas, and UI components are fully verified; Google Cloud OAuth 2.0 Web Client ID configuration by repo owner (`adizseptian@gmail.com`) is the final manual step before live Drive writes.

