# Changelog

## v0.5.1 — QA corrections (2026-10-28)
- Corrected stale README heading and active design identity to TOKO MODE.
- Changed the browser theme-color meta tag to the light TOKO MODE paper token.
- Replaced sidebar “FIELD LEDGER” label with “TOKO MODE”.
- Applied orange/lime styling to the actual Home status-panel class and maintained high-contrast text/actions in light and dark themes.
- Increased mobile navigation label size and retained a 48px minimum target height. Expanded mobile icon, row-remove and quick-chip targets to 44px in CSS (static only; rendering still needs browser verification).
- Replaced mixed-unit `totalRemainingUnits` with `remainingByUnit`, preserving units separately.
- Guarded line preview calculations so unsafe row values do not throw during React rendering; oversized whole stock totals are surfaced as an error and block the review action.
- Added explicit unit-specific test expectations for pcs and porsi quantities.

## v0.5.0
- Applied TOKO MODE bright retail visual layer to React/Vite starter.
