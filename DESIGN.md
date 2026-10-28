---
name: TOKO SAKALA — TOKO MODE
version: 2.0.0
status: design direction for prototype review
platforms: [mobile-first web app, responsive desktop]
principles: [task-first, retail-native, bright-functional, honest-finance, accessible]
---

# TOKO SAKALA — TOKO MODE

## Overview

**Design direction:** cheerful value-retail utility with the clarity of a well-made point-of-sale tool. This is deliberately a different visual world from the earlier Quiet Commerce / Field Ledger concept: warm paper background, near-black ink, hard-edged borders, bright orange, electric lime, and a small blue accent. It should feel **affordable, active, and useful**, never careless, childish, or low-trust.

**Product character:** *Catat cepat. Jelas hitungannya.* A shop owner must understand what to do without learning accounting vocabulary. The software carries the complexity; the user records simple events.

**Liveliness dials:** ENERGY 4/5 · RHYTHM 4/5 · MOTION 1/5. Use expressive color blocks, compact action-led composition, strong numerals, and responsive controls. Keep motion brief and optional. Finance states must not become playful or ambiguous.

**Main use environment:** Android mobile browser, often one-handed, interrupted, and used while working. Design for 320–430 px first; enhance to tablet/desktop after the mobile workflow is coherent.

## Colors

| Token | Value | Purpose |
|---|---|---|
| `color.paper` | `#FFFDF6` | Primary surface and form background |
| `color.canvas` | `#F4F0E7` | Overall warm work surface |
| `color.ink` | `#20211F` | Text, primary outline, high-contrast controls |
| `color.muted` | `#686A65` | Secondary text only; verify WCAG AA for each use |
| `color.orange` | `#FF5A1F` | Main action, urgent attention, bold brand anchor |
| `color.orange-dark` | `#D93C08` | Hover/pressed accent where contrast is verified |
| `color.lime` | `#D7FA4A` | High-priority secondary action and active navigation |
| `color.blue` | `#2958E8` | Secondary action and link; not a status by itself |
| `color.blue-pale` | `#E8EDFF` | Neutral information surface |
| `color.success` | `#177245` | Success text/icon paired with words or symbols |
| `color.success-bg` | `#E4F5E9` | Success background |
| `color.warning` | `#98500D` | Warning text/icon paired with explicit label |
| `color.warning-bg` | `#FFF0DA` | Warning background |
| `color.danger` | `#B52821` | Error / mismatch text and icon |
| `color.danger-bg` | `#FFE7E3` | Error surface |
| `color.line` | `#DEDBD2` | Quiet separators; never the only means to identify a field |

Rules:
- Orange is an action/attention color, not an automatic indicator of bad data.
- Lime means selected or important; never use lime alone to communicate success or warning.
- Blue is for navigation, information, and optional actions, not fake progress.
- Green, amber, and red always include a text label and/or icon. Status is never color-only.
- No violet gradients, frosted glass, ornamental background blobs, fake chart trends, fake ratings, or decorative bento grids.
- Don't use more than one large orange region on one mobile screen. Lime should be a small high-signal accent.

## Typography

Primary UI: `Inter, "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif` (use local/system fallback; do not require a remote font to render correctly).

| Token | Size / line-height | Weight | Usage |
|---|---|---|---|
| `type.display` | 30–36 / 1.03 | 900–1000 | Page title, one key number only |
| `type.hero-value` | 32–40 / 1.05 | 950–1000 | Main money figure |
| `type.title` | 18–20 / 1.15 | 850–950 | Section heading |
| `type.body` | 14–16 / 1.45 | 400–600 | Main text and instructions |
| `type.control` | 14–16 / 1.3 | 500–700 | Text in form controls |
| `type.label` | 11–12 / 1.3 | 800–900 | Field labels and micro-headings |
| `type.meta` | 10–12 / 1.35 | 500–700 | Secondary data; never for crucial instructions alone |
| `type.money` | UI size / 1.1 | 800–1000 | Tabular numerals, `font-variant-numeric: tabular-nums` |
| `type.code` | 12–14 | 500 | IDs, import diagnostics, technical references only |

Use tight tracking for large headings, default tracking for body copy. Currency numbers should line up. Never set body copy below 12px in production; metadata may be 10–11px only if non-critical and tested on real phones.

## Layout & Spacing

Spacing scale in px: `4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48`.

Radius scale: `8` compact chip, `10–12` input and small control, `13–15` list item, `16–18` form panel, `22` key hero. Avoid mixing many unrelated radii.

Borders: strong 1.5px ink border is a defining graphic motif for main actions and data containers; quiet separators use 1px neutral line. Hard 2–3px bottom offset shadow only on tactile primary controls and key cards. No ambient blur shadow on every card.

Mobile layout:
- Base width 320 px; primary design target 360–430 px.
- 16 px side padding; 12–16 px between major sections; 8–10 px inside dense lists.
- Main content is a single column. Forms never use two columns below 760 px; quantity and unit may share a row only when each remains at least 120 px wide and stays readable at 320 px.
- Five bottom navigation destinations: Beranda, Catat, Stok, Setoran, Lainnya. Keep bottom action area inside safe-area insets and do not cover form controls.
- Touch targets at least 44×44 CSS px, preferably 48×48 for repeated steppers.
- Horizontal chips may scroll horizontally; page body must not overflow horizontally.
- Use a visible sticky bottom CTA only when that screen has one clear next action; avoid duplicating two equal-primary buttons.

Desktop enhancement:
- At 760 px, convert to a persistent left rail (220–246 px); content gets the remaining width.
- At 760 px and above, form + preview can become two columns; keep field order identical to mobile.
- At 760 px and above, stock may use a 2-column card list. Do not make desktop the source of truth for the workflow.
- Maintain max readable width; don't stretch money lines edge-to-edge.

## Elevation & Depth

Use ink borders, paper-to-canvas tonal contrast, and a hard 2px offset shadow sparingly. No glassmorphism, no layered floating cards without a functional hierarchy, no drop shadow under every row. The main action should be visible by color and placement, not by glow.

## Shapes

- Buttons / inputs: 10–12 px radius.
- Main hero: 20–22 px radius; only one focal hero per screen.
- List items and review panels: 12–16 px radius.
- Status tags: small square-ish capsule with clear wording; don't use decorative badges to label all headings.
- Product identity: use user-owned product images if supplied. Otherwise prefer clear placeholders/icons with visible item name and unit; never generate fake brand packaging and present it as a real product.

## Components

### App shell
- Mobile header: compact brand, one optional notification action, owner avatar only if profile action exists.
- Bottom navigation: five labeled items with simple icons. Always pair icon with text.
- Desktop side rail replaces (does not duplicate) bottom navigation.

### Home / daily work
- First fold: greeting/date → one prioritized attention item → 4 direct task actions → shop figures → latest activity.
- Prioritize an action that needs human verification, not an arbitrary KPI.
- Every money tile must label its meaning: Penjualan terhitung, Uang diterima, Uang siap diserahkan, Modal barang terjual, Biaya toko, Laba kotor/laba bersih estimasi.
- Never use a single “Saldo” figure that mixes cash, sales, and handover.

### Inputs / forms
- One explicit label above each input; no placeholder-only labels.
- Persistent units and source-of-money selection. Blank, zero, unknown, and confirmed are different states.
- Provide inline error near the field and preserve valid input after an error.
- Dynamic review panel must say “Pratinjau — belum disimpan”.
- User can choose Uang toko / Uang pribadi / Belum tahu; unknown must not silently alter shop cash.
- Do not autosave financial events behind the user's back.

### Stock list
- Product name + category + unit; quantity uses `—` for not filled and `0` only for explicitly confirmed zero.
- Use per-item stepper and direct numeric input. Disabled decrement at zero; blank first increment should state its semantics and must not make 0 look confirmed without user action.
- Never sum quantities with unlike units (pcs + kg + liters) into a single “total pieces” number.
- Retail value of stock must say “nilai jual sisa”, use only known prices, and state when the result is incomplete.

### Employee handover / setoran
- Show separate values for estimate, actual received, and difference.
- Difference calculation must be traceable; no auto-confirmation on zero or non-zero mismatch.
- Clearly explain cash handover from employee to owner; never call it bank deposit.
- A mismatch should be neutral but unmistakable: text, sign, icon, and amount.

### Reports and history
- Report periods are explicit; PDF / Excel are separate actions with their own progress and errors.
- Use labeled cards and responsive rows on mobile, not squeezed desktop tables.
- History is append-only by default. Corrections are linked entries; no silent edits to a closed period.
- Destructive actions must not appear as an isolated trash icon. If any irreversible operation exists in production, add staged confirmation, explain scope, require deliberate final action, and provide backup guidance.

### Interaction states
- Every control must work or be clearly disabled with a reason.
- Provide hover, focus-visible, pressed, disabled, loading, empty, error, unknown, and success states.
- Toasts confirm only local prototype actions. Never announce that a record was saved unless the server confirms it.
- Motion: 120–180 ms for tiny state changes; no parallax, looping, confetti, auto-animated charts, or motion that competes with typing.
- Respect `prefers-reduced-motion`.

## 5 Layers of UX (required gate)

1. **Strategy:** design for shop-owner jobs; verify user need and success measures before decoration.
2. **Scope:** every displayed function has a clear contract, explicit unavailable/unknown states, and no invented features.
3. **Structure:** navigation, screen sequence, information model, and task completion paths are consistent.
4. **Skeleton:** mobile first-fold, fields, CTAs, keyboard, safe area, and responsive layout are usable at 320–430 px.
5. **Surface:** type, color, surfaces, imagery, motion, and small details support the preceding four layers.

A beautiful Surface never compensates for an unsafe Strategy, a missing Scope decision, confusing Structure, or an unusable Skeleton.

## Do's and Don'ts

### DO
- Use strong typographic hierarchy and a recognizable retail palette.
- Use realistic Indonesian microcopy: “Belum diisi”, “Belum diketahui”, “Perlu diperiksa”, “Sudah dikonfirmasi”.
- Give each screen one primary action and a clear next step.
- Use actual product units and source-of-money choices.
- Show the math near the amount it explains.
- Test with long product names, Rp0, blank fields, large amounts, 320px width, zoom, keyboard, and reduced motion.

### DON'T
- Don't return to beige-and-forest premium cards with subtle gold accents from the previous direction.
- Don't compose every page as a generic metric-card grid.
- Don't use giant unused whitespace, gratuitous hero copy, or decorative typography above daily work.
- Don't use random unsplash photos, generated pack shots, emoji as the only semantic icon, or pseudo-real dashboard statistics in production.
- Don't imply data is stored, exported, synced, or secure unless that behavior is actually implemented and verified.
- Don't change calculation logic as part of a visual redesign.

## Required agent response before implementation

1. Name the screen/task being built and its primary user job.
2. Identify 2–3 relevant reference patterns and what is borrowed (behavior/hierarchy, not copied pixels).
3. State token/component changes needed; reuse existing tokens where possible.
4. Explain how the result supports the first four UX layers before discussing decoration.
5. Finish with a PASS/FAIL evidence checklist for behavior, mobile layout, accessibility, and visual consistency.
