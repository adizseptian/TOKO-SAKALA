# TOKO SAKALA Anti-Slop Gate (project adaptation)

This is a project-specific checklist inspired by the public Anti-Slop repository. It is not a copy of the full upstream rulebook and does not claim that the upstream rules were automatically run. Source: https://github.com/miqdadbadjuber/anti-slop

## Before implementation

- [ ] Read `DESIGN.md` and this file before generating/editing UI.
- [ ] State the actual user task and why the page elements exist.
- [ ] Pick 2–3 references for the task and describe the behavioral/design pattern used. Do not clone the entire look of another product.
- [ ] Define ENERGY / RHYTHM / MOTION for the screen.

## Hard quality gates

- [ ] No blue-purple gradient, gratuitous glassmorphism, glow everywhere, or background pattern without product purpose.
- [ ] No generic hero + same-size feature-card wall, fake metrics/trends/testimonials, fabricated trust or security claims.
- [ ] No fake product packaging/photo assets; use approved assets or clearly neutral placeholders.
- [ ] No placeholders as the only field labels; no icon-only labels for critical navigation.
- [ ] No dead controls. A not-yet-built function must be absent or visibly marked unavailable with explanation.
- [ ] No false success toast, fake storage, or claim that a local preview was saved.
- [ ] No horizontal overflow at mobile breakpoints; touch targets >=44px; visible keyboard focus; reduced motion supported.
- [ ] Empty, loading and error states exist for data-driven production screens.
- [ ] Finance values are honest, sourced and traceable. Unknown is not zero. Blank is not zero. Mixed units are not added together.
- [ ] Colors meet WCAG AA after a measurable contrast audit. Do not infer contrast from appearance.

## Purpose gates

For every use of animation, shadow, badge, card, gradient, illustration, icon, or color highlight, state the user benefit. Remove it if no benefit can be named. Repetition needs a reason; do not give every card the same treatment if their information priority differs.

## Craftsmanship gate

Review with a production-like sample containing long names, large Rupiah amounts, missing data, explicit zero, mismatch, empty list, validation error, and narrow mobile width. Confirm that the design remains readable, resilient and functional.

## Delivery report (required)

| Gate | Result | Evidence |
|---|---|---|
| Intentionality | PASS/FAIL/NOT RUN | Decision and rationale |
| Functional completeness | PASS/FAIL/NOT RUN | Tested actions and failures |
| Content-driven composition | PASS/FAIL/NOT RUN | Why each section exists |
| Resilience | PASS/FAIL/NOT RUN | Widths and states tested |
| Evidence over claims | PASS/FAIL/NOT RUN | Source of figures, claims, and save states |
| Mobile/accessibility | PASS/FAIL/NOT RUN | Browser/device, viewport and contrast results |

Do not report PASS when a check is unrun. A screenshot can support visual review but does not prove working behavior or production data integrity.
