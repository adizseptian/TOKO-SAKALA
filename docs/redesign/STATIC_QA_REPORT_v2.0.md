# Static QA Report — TOKO MODE v2.0.0

Status: **static syntax/structure checks passed; browser/device-level checks not verified**. No production readiness claim.

## Checks completed in this environment

| Check | Result | Evidence |
|---|---|---|
| JavaScript syntax | PASS | Extracted inline script passed `node --check` with no diagnostics. |
| HTML parser | PASS | Python HTML parser reads the document and extracts title, 11 screen sections, forms and labeled controls. |
| CSS brace balance | PASS | 211 opening and 211 closing braces in the final inline stylesheet. |
| Direct JavaScript ID references | PASS | 46 direct `$('#id')` references; no missing matching static IDs. |
| External runtime dependencies | PASS | No external script or stylesheet dependency required by the standalone prototype. |
| Network/storage persistence | PASS | No `localStorage`, `sessionStorage`, `indexedDB`, `fetch`, `XMLHttpRequest` or `sendBeacon` usage in the HTML. |
| Browser screenshot / interactive run | NOT RUN | Chromium navigation to both local file and local HTTP URL is blocked with `ERR_BLOCKED_BY_ADMINISTRATOR`; browser interaction assertions could not execute. |
| Mobile overflow at 320–430px | NOT VERIFIED | CSS breakpoint rules are present; a live viewport sweep was blocked. |
| Desktop rail rendering | NOT VERIFIED | Desktop breakpoint rules are present; a live viewport sweep was blocked. |
| Selected token-pair contrast calculations | PARTIAL PASS | Calculated key pairs: ink/paper 15.89:1; muted/paper 5.38:1; muted/canvas 4.81:1; ink/orange 5.19:1; white/orange-dark 4.57:1; white/blue 5.74:1; success/warning/danger label pairs 5.25–5.41:1; ink/lime 13.60:1. This is not an all-states WCAG audit. |
| Full WCAG contrast audit | NOT RUN | Remaining combinations, rendered alpha layers, focus states and app browser rendering need a contrast linter and visual inspection. |
| Screen-reader / keyboard device audit | NOT RUN | Needs browser/device test. |
| Backend/auth/RLS/export/backup | NOT IMPLEMENTED | This HTML prototype is intentionally local and non-persistent. |

## Required follow-up

- Re-run `node --check` and structural checks on the exact final file.
- Test at 320 / 360 / 390 / 430 / 768 / 1024 / 1440 CSS px in Android Chrome and a desktop browser.
- Check zero/blank/unknown states and long Indonesian strings/large Rp amounts.
- Measure all shipped color pairs with a WCAG checker; change any failing pair.
- Test keyboard/focus, 200% zoom, virtual keyboard, safe areas and reduced motion.
- Run the anti-slop delivery gate if `ANTISLOP.md` has been installed into the app repository. This package points to the source repository but does not bundle or claim to run antislop.

Passing static checks does not establish backend integrity, accessibility certification or production safety.
