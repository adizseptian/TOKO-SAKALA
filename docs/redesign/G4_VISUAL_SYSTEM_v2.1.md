# G4 — Visual System v2.1 · TOKO MODE

## Brand idea

**Retail utility with a loud, helpful interface.** Visual system should feel recognizable in one screenshot. The main graphic devices are orange action panels, black ink outlines, lime active states, sharp typographic numerals, compact labeled icon tiles and paper-like surfaces. Avoid the previous subdued luxury direction.

## Tokens

| Name | Value | Role |
|---|---|---|
| `--paper` | `#FFFDF6` | Form and card surface |
| `--canvas` | `#F4F0E7` | Background |
| `--ink` | `#20211F` | Main ink |
| `--muted` | `#686A65` | Supporting text |
| `--line` | `#DEDBD2` | Quiet separators |
| `--orange` | `#FF5A1F` | Brand/action/attention |
| `--orange-dark` | `#D93C08` | Pressed/darker action |
| `--lime` | `#D7FA4A` | Selected/priority accent |
| `--blue` | `#2958E8` | Secondary actions and links |
| `--blue-pale` | `#E8EDFF` | Information surface |
| `--green` | `#177245` | Success foreground |
| `--green-pale` | `#E4F5E9` | Success surface |
| `--amber` | `#98500D` | Warning foreground |
| `--amber-pale` | `#FFF0DA` | Warning surface |
| `--red` | `#B52821` | Error foreground |
| `--red-pale` | `#FFE7E3` | Error surface |

### Contrast note

Palette tokens are direction, not proof of WCAG compliance. `--muted` on `--canvas`, status pairs and buttons require automated contrast audit during implementation. If a pair fails WCAG AA, adjust the pair while preserving the color family. Do not ship based on visual intuition alone.

## Typography

- UI: `Inter, Plus Jakarta Sans, system-ui, sans-serif`. Keep system fallback; no mandatory remote font request.
- Money: tabular numerals, high weight, explicit Indonesian currency formatting.
- H1: 30–36px/1.03, weight 900–1000, tight negative tracking.
- Section title: 18–20px/1.15, weight 850–950.
- Body: 14–16px/1.45.
- Labels: 11–12px/1.3, weight 800–900.
- Meta: 10–12px/1.35, non-critical only.
- Avoid using small uppercase labels for essential instructions.

## Geometry

- Spacing set: 4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48px.
- Radius set: 8, 10, 12, 14, 16, 22px.
- Borders: 1.5px ink on primary interaction cards and key summaries; 1px line for separators.
- Shadows: `0 2px 0 var(--ink)` for primary tactile controls; avoid ambient shadows everywhere.
- Primary mobile outer margin: 16px; wider desktop 30–40px.
- Minimum interactive target 44×44 CSS px; repeated stock steppers preferably 44px production size (prototype is compact in card row; expand in production if usability testing requires it).

## Responsive behavior

| Width | Behavior |
|---|---|
| 320–759px | Mobile baseline, bottom nav, one-column forms, horizontally scrolling category chips |
| 760–1099px | Desktop rail replaces bottom nav, larger content pad, form + preview can split if each column remains usable |
| 1100px+ | Wider rail/content; retain bounded text measure and two-column stock cards |

At every width: no body-level horizontal overflow; bottom nav respects safe-area; focus doesn't hide under fixed navigation; controls remain operable at 200% zoom.

## Component specs

### Main attention panel
- Orange surface, white text, ink border, 20–22px radius, one main amount, one explicit status and one CTA.
- No rings, glow or animation. Decorative type is low-opacity and must not collide with content.

### Quick-action tile
- 4 columns at phone widths only if each tile stays at least ~64px wide; otherwise 2×2.
- Icon in square colored tile, two-line text label, no icon-only operation.
- Whole tile is clickable, semantically a button/link.

### Money stat
- Label above number and short explanation below.
- Only first-priority state gets saturated background. Other numbers use paper cards.
- Never color code positive money as “profit” without matching calculation definition.

### Input
- Label above control; 46px min height in this prototype direction.
- Focus ring 3px blue; visible at keyboard navigation.
- Numeric input uses `inputmode=numeric`, appropriate validation and unit adjacency.
- Placeholder is example text only, never the sole label.

### Segmented control
- Use for a small exclusive choice, such as source of money.
- Active segment uses ink/lime rather than relying on subtle background change.
- Values include explicit “Belum tahu” where uncertainty is valid.

### Status tags
- Tight but legible, with wording and optionally an icon.
- Avoid using a badge on every section heading. Use one only where status changes user action.

### Stock card
- Product identifier + category + unit, right-aligned quantity, status label, direct entry and stepper.
- Quantity `—` = not entered; `0` = explicitly zero. Price unknown blocks full-value calculation.
- Product image is optional; no generated photos used as source-of-truth asset.

### Setoran comparison
- Three separate surfaces/rows: amount expected, amount received, difference.
- The difference gets warning treatment and explanation. Color is redundant with label, icon and numeric comparison.

### Bottom nav
- Five destinations with icon + name. Active item uses lime surface and dark ink.
- Do not add sixth nav item because a screen was difficult to organize; move it to a task hub.
- Fixed footer includes safe-area padding and sufficient page bottom space.

## Motion / interaction

- Page transition 120–180ms, subtle and optional.
- Respect `prefers-reduced-motion`.
- No parallax, auto-looping graphics, pulsing badges, animated gradients or confetti for finance actions.
- Buttons may use a 2px physical press effect; focus states remain independent.
- Toast text must accurately describe whether operation was local, previewed, committed or failed.

## Content design

Use short Indonesian words; prefer:
- “Uang perlu diserahkan” over “Expected deposit”.
- “Uang diterima pemilik” over “Cash settlement”.
- “Selisih” followed by explanation, not an unexplained red negative.
- “Belum diisi” for absent input; “0” only for recorded zero; “Belum diketahui” for unknown data; “Perlu diperiksa” for mismatch/uncertainty.
- “Periksa catatan” before persistence and “Tersimpan” only after backend confirmation.

## Anti-slop denylist

No violet default gradient; no glass cards; no random photography; no generated product package shown as real; no repeated generic metric-card grid; no sparkle hero; no fake growth indicators; no unlabelled icon buttons; no made-up trust badges; no dead clicks; no decorative 404 reused for a finance state; no random border-radius mix; no placeholder-only fields; no automatic “saved” toasts in a static prototype.
