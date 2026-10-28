# Coding Agent Rules — TOKO SAKALA TOKO MODE

Before making any change, read `DESIGN.md`, `docs/redesign/G3_SCREEN_BLUEPRINT_v2.1.md`, `docs/redesign/G4_VISUAL_SYSTEM_v2.1.md`, `docs/redesign/G5_IMPLEMENTATION_QA_v2.1.md`, `docs/redesign/REFERENCE_RESEARCH_DECISIONS_v2.0.md`, `docs/redesign/IMPLEMENTATION_STATUS_v0.5.1.md`, and `docs/DECISION_REGISTER.md`.

## Non-negotiable product rules
- Mobile-first at 320–430 CSS px; desktop is an enhancement, not the source workflow.
- Active visual direction is TOKO MODE: `#FFFDF6` paper, `#20211F` ink, `#FF5A1F` orange, `#D7FA4A` lime, `#2958E8` cobalt. Never reintroduce the old Field Ledger palette as active styling.
- User-facing language is Indonesian and beginner-friendly.
- Blank, zero, unknown, incomplete, preview and confirmed values are distinct.
- Never add unlike quantities (pcs, kg, porsi, liters, etc.) into a single physical total. Keep quantities grouped by unit.
- Never equate a selling-price value with modal or profit.
- Sales, received money, cash available and expected employee handover are separate concepts.
- UI preview is not a saved transaction. Do not activate save controls, database access, auth, reports/exports or AI integration as part of a visual-only patch.
- AI defaults OFF. No model/network call is implemented; never add a client-side API key.
- No fake financial figures or success copy that implies a server-confirmed write.
- Do not replace the build system, change frameworks, or rewrite all of `App.tsx` for a visual adjustment without explicit request and reviewable diff.

## Verification requirement
For code changes run `npm run scan:secrets`, `npm run test`, and `npm run build`, and report the actual outputs. For UI changes test at 320, 360, 390, 430, 768, 1024 and 1440 CSS px; check horizontal overflow, fixed bottom-nav overlap/safe area, keyboard, focus, 44×44 touch targets, long Indonesian copy/Rupiah strings, light/dark themes, and reduced motion. If a test cannot run, state why; do not claim PASS.
