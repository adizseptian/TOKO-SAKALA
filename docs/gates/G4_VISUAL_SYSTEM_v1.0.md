# TOKO SAKALA — G4 Visual System v1.0

**Direction:** FIELD LEDGER — Quiet Precision for Everyday Business.  
**Mood:** warm, practical, premium through restraint; designed for a real shop workflow, not a generic SaaS metrics gallery.  
**Theme baseline:** light-first, with a separate deep-forest dark token set now implemented in the React source and standalone prototype. Both themes remain un-certified until rendered browser/device contrast and state testing are completed.

## 1. What the reference research informed

- **Nielsen Norman Group:** forms create cognitive load; improve structure, clarity, transparency, and support; reduce fields and unnecessary choices. Applied as visible labels, one-column mobile forms, smart-but-honest defaults, and concise contextual explanations.
- **Apple Human Interface Guidelines:** group related elements, place essential information early, align for scanning, and use progressive disclosure. Applied to the five-part information architecture and quieter dashboard hierarchy.
- **GOV.UK Design System:** visible labels, labels above fields, placeholders not used as the only label, numeric input modes, and specific actionable errors. Applied to purchase/expense forms and stock entry.
- **W3C WCAG 2.2:** AA text contrast, keyboard-visible focus, and minimum pointer target sizing. The implementation targets 44–48px for frequently used controls, stricter than WCAG's 24px minimum-target criterion in many cases.
- **Android accessibility guidance:** 48dp is a suitable touch-target target in Android-native contexts; web CSS pixels and Android dp are not identical units, so the mobile UI uses a practical 44–48 CSS px baseline and must still be checked on-device.
- **Paper Design tokens documentation:** design values should be named and shared with code, rather than scattered as unrelated hard-coded values. Applied with CSS custom properties and a consistent spacing/typography scale.
- **Mobbin / Refero:** treated as pattern-discovery libraries for real screen sequences and common interface patterns—not as authoritative proof of usability and not as artwork to copy. Their best role in this product is cross-checking mobile task flows, list rows, filters, form states and navigation hierarchy.
- **Dribbble / Behance / Pinterest:** moodboard-only. Avoid treating concept shots as evidence that a pattern works in live store workflows.

## 2. Palette tokens

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#F4F0E7` | Warm ivory canvas |
| `--surface` | `#FCFAF5` | Primary content surface |
| `--surface2` | `#F8F5ED` | Secondary panel / hover |
| `--surface3` | `#EEE9DE` | Table header / muted grouping |
| `--text` | `#292D29` | Main text |
| `--muted` | `#5B625C` | Secondary text and helper copy |
| `--line` | `#D8D3C7` | Dividers / borders, not standalone text |
| `--teal` | `#315B49` | Brand primary, focus, primary actions |
| `--bronze` | `#AD8654` | Small restrained accents, icon/border; not small body text on ivory |
| `--danger` | `#8A352C` | Error state text/icon on pale red surface |
| `--warning` | `#6A4B24` | Warning text on pale amber surface |
| `--success` | `#315B49` | Success text/icon on pale green surface |

### Dark theme tokens (implemented, not certified)

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#141B17` | Deep forest canvas |
| `--surface` | `#1C2720` | Primary panel surface |
| `--surface2` | `#202E25` | Secondary surface / hover |
| `--surface3` | `#2B392F` | Raised surface |
| `--text` | `#F0F2EA` | Main text |
| `--muted` | `#C0C9C0` | Secondary text |
| `--teal` | `#9AC9A6` | Accessible green action/focus accent on dark canvas |
| `--bronze` | `#D2B17A` | Restrained accent, not default small body text |
| `--warning` | `#F3D59F` on `#3A2E1E` | Warning copy and state |
| `--danger` | `#F0A8A0` on `#3A2423` | Error copy and state |

### Contrast calculations

Ratios are computed from the sRGB luminance formula and rounded to two decimals. These checks validate only the listed exact pairs, not every rendered state or browser antialiasing.

| Foreground / background | Ratio | Interpretation |
|---|---:|---|
| `#292D29` on `#F4F0E7` | 12.30:1 | Pass AA normal text |
| `#5B625C` on `#F4F0E7` | 5.52:1 | Pass AA normal text |
| `#315B49` on `#F4F0E7` | 6.78:1 | Pass AA normal text |
| `#FFFFFF` on `#315B49` | 7.71:1 | Pass AA normal text |
| `#6A4B24` on `#F5EBD8` | 6.15:1 | Pass AA normal text |
| `#8A352C` on `#F8E8E5` | 6.14:1 | Pass AA normal text |
| `#AD8654` on `#F4F0E7` | 2.92:1 | **Fail** for small text; restrict to decorative/accent use |
| `#D8D3C7` on `#F4F0E7` | 1.34:1 | Border can group content but is not suitable as the only focus/status boundary |
| `#F0F2EA` on `#141B17` | 15.51:1 | Pass AA normal text (dark theme) |
| `#C0C9C0` on `#141B17` | 10.31:1 | Pass AA normal text (dark theme) |
| `#9AC9A6` on `#141B17` | 9.41:1 | Pass AA normal text (dark theme) |
| `#142018` on `#8DB99C` | 7.64:1 | Pass AA normal text for primary button (dark theme) |
| `#F3D59F` on `#3A2E1E` | 9.33:1 | Pass AA normal text for warning state (dark theme) |
| `#F0A8A0` on `#3A2423` | 7.42:1 | Pass AA normal text for error state (dark theme) |

## 3. Type and numbers

- No external web-font dependency in the prototype. Use system sans-serif first to keep load predictable and avoid dependence on Google Fonts.
- Headings: 26–34px desktop; 25–28px mobile; bold but not ultralight.
- Body: 13–14px default; form labels 12px bold; secondary/helper copy usually 11–12px, with contrast preserved.
- Use `font-variant-numeric: tabular-nums` for currency, quantities, and reconciliations.
- Rupiah formatting: `id-ID`, whole Rupiah by default. Keep the currency indicator visually attached to the amount.
- Sentence case; familiar Indonesian terms. Avoid accounting jargon at first and second disclosure levels.

## 4. Layout and component geometry

- Spacing scale: 4, 8, 12, 16, 24, 32, 40, 48px.
- Main content: 24–32px desktop gutters; 14px mobile gutters; maximum desktop reading width 1420px.
- Panel radius 12–14px; no giant floating card stacks or glossy/blurred data panels.
- Borders are quiet structure, shadows are almost absent, and the accent color is used sparingly.
- Primary action: one prominent filled forest-green button per task screen; secondary actions neutral.
- Inputs: visible label above control; at least 44px high; 46px preferred on mobile. Numeric fields use `inputMode="numeric"`.
- Bottom navigation: five equal primary destinations, text plus icon, selected background plus color/weight; reserve safe-area padding.
- Mobile product rows and stock count rows are vertically stacked cards—not reduced desktop tables or horizontal scrolling data grids.
- Mobile form field groups collapse to one column. Side-by-side controls are reserved for short, tightly related values at larger widths.

## 5. Status, certainty and writing

- `Pasti`: ordinary neutral/success presentation where appropriate.
- `Perlu Diperiksa`: warning text + icon + short reason, using a pale warm surface.
- `Belum Diketahui`: neutral language; never displayed as zero.
- `Belum disimpan`: persistent near preview/form output, not only a toast.
- `Tersimpan`: permitted only after authoritative persistence confirmation; not currently available.
- `Belum pasti tersimpan`: future state for uncertain network commit, with safe retry.
- `Setoran cocok`/`Setoran perlu diperiksa`: factual, neutral; never imply theft or blame without evidence.
- Error messages name the field/problem and the repair. Preserve input in error states.

## 6. Motion and responsive behavior

- Hover and press states communicate action; no continuously moving decoration.
- Respect `prefers-reduced-motion: reduce`.
- Mobile-first review widths: 320, 360, 390, 430px; tablet: 768, 1024px; desktop: 1280 and 1440px.
- Test page title truncation, keyboard overlays, safe areas, card overflow, long product names, long Rupiah values, and viewport zoom.
- A distinct dark theme is implemented as a separate token set; it is not produced by mechanically inverting light colors. The calculated pairs above are only a subset; rendered states, disabled controls, diagrams, and mobile devices remain to be tested.

## 7. Components established in code

- Shell and 5-item navigation.
- Theme selection in Settings: light and dark variants; preference saved separately from financial data in React build, in-memory only in standalone prototype.
- Page title, status pill, warning/info note, empty state.
- Primary/secondary buttons with minimum height.
- Labeled fields and source-of-money radio group.
- Home task row, hub action row, responsive stock input card, live preview surfaces.

## 8. QC rules

1. Never use bronze as small body text on ivory.
2. A color-coded state must have visible text and icon or equivalent textual explanation.
3. Focus indicator must remain visible on keyboard navigation; contrast and obstruction need manual verification.
4. Do not call the prototype WCAG-certified. This is an initial token/geometry review, not a full accessibility audit.


## 9. Research sources and how they were applied

- [Nielsen Norman Group — Four Principles to Reduce Cognitive Load in Forms](https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/): plain language, fewer unnecessary choices, and predictable groupings.
- [Apple Human Interface Guidelines — Layout](https://developer.apple.com/design/human-interface-guidelines/layout): priority-first information hierarchy, related grouping, and layout adaptation.
- [GOV.UK Design System — Text input](https://design-system.service.gov.uk/components/text-input/): persistent visible field labels and clear numeric entry.
- [GOV.UK Design System — Error message](https://design-system.service.gov.uk/components/error-message/): specific, repairable errors without clearing user input.
- [W3C — WCAG 2.2](https://www.w3.org/TR/WCAG22/): text contrast and interaction accessibility target.
- [Android Accessibility — Touch targets](https://support.google.com/accessibility/android/answer/7101858): practical touch-area target.
- [Paper Design — Design tokens](https://paper.design/docs/tokens): shared tokens for colors, spacing, typography, radius and responsive rules.
- [Mobbin](https://mobbin.com/) and [Refero](https://refero.design/): useful for observing real product patterns; visual inspiration remains subordinate to the store workflow and business rules.

**Source hierarchy:** product rules, existing calculation engines and pending-decision register take precedence over inspiration sites. Community moodboards are not treated as evidence of usability. The selected palette was contrast-calculated for the pairs listed above. Contrast ratios are computed from sRGB colors; neither the whole rendered app nor the standalone prototype has been certified against WCAG.
