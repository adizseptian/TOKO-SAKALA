# Reference Research & Design Decisions — v2.0

Research date: 28 October 2026. This is a design synthesis, not a claim that every gallery was fully browsed screen by screen. Where a platform requires login or blocks full-screen capture, its public positioning and page taxonomy informed the research method; implementation choices are explicitly listed below.

## Source-to-decision map

| Source | What it is useful for | Decision in TOKO MODE | What we do not copy |
|---|---|---|---|
| [Mobbin](https://mobbin.com/) | Real app/site screens, flows, UI elements and animations | Start references by task: expense entry, stock check, handover, search/filter, numeric stepper, bottom nav | Do not copy screenshots or brand identity; don't treat its screen count as proof of fit |
| [Appllama](https://appllama.io/) | Mobile screen and flow inspiration | Mobile-first single-column form, clear step sequence and action placement | Avoid copying platform-specific UI that conflicts with Android browser |
| [Appshots](https://appshots.design/) | Mobile UI gallery | Use to compare density, type hierarchy and screen-specific composition | Do not add visuals only because a gallery shows them |
| [60fps](https://60fps.design/) | Motion/interaction references | Tiny press states, fast transitions and reduced-motion compliance | No looping background/attention-grabbing motion on finance screens |
| [Screens Design](https://screensdesign.com/) | Real product screens and pattern discovery | Review specific list, form and detail patterns before production implementation | Don't turn “screen inspiration” into direct pixel tracing |
| [Refero](https://refero.design/) | Real screens, flows, UI elements, mobile/web search and taxonomy | Use tags around search/filter, checklist/activity feed, shopping, money transfer, form and nav patterns | Don't import marketing-page layout into operational app by default |
| [Godly](https://godly.design/) | Curated visual web/app work and mobile screenshot gallery | Source visual cues for bold typography and distinctive brand expression; its mobile screenshot gallery is relevant to app composition | Do not use a promotional hero, giant web footer or decorative site grid on routine forms |
| [Behance UI/UX](https://www.behance.net/galleries/ui-ux/ui-ux) | Broad design case studies and concept exploration | Compare narrative, hierarchy and visual personality when needed | Concept shots are not evidence of working interactions |
| [Navbar Gallery](https://www.navbar.gallery/) | Navigation inspiration | Compare compact nav labels and active states | Not used to increase primary destinations above five |
| [CTA Gallery](https://www.cta.gallery/) | Call-to-action patterns | One primary action per screen; distinguish preview from commit | Avoid multiple competing high-emphasis CTAs |
| [SupaHero](https://supahero.com/) | Hero section inspiration (site may move) | One attention panel for one priority state on Home only | No repeated oversized hero blocks on every app screen |
| [Footer Design](https://footer.design/) | Website footer patterns | No direct mobile product impact; use only if public-site footer is later redesigned | Not applicable to operational app navigation |
| [BentoGrids](https://bentogrids.com/) | Bento composition inspiration | Reconsider grouping for metrics only when it increases scanning speed | No default bento grid. Operational mobile layout should be task-first |
| [404s Design](https://www.404s.design/) | Error-page visual patterns | Empty/error states should explain recovery clearly | Don't use a decorative 404 illustration instead of explaining a failed financial action |
| [Design.md generator — DesignMD](https://www.designmd.co/) | Catalogued tokenized design directions | Keep tokens in one canonical Markdown file | Do not choose a brand preset and ship without evaluating fit |
| [Context.dev Design.md tools](https://www.context.dev/free-tools) | Free utility/generator catalog; includes website screenshot and conversion tools | Potential for checking or exporting documentation; keep tokens manually reviewed | Generated tokens are not assumed accessible or correct |
| [Design.dev DESIGN.md generator](https://design.dev/ai/design-md-generator/) | Tokenized design system, contrast linting and export workflows | Follow explicit token naming, usage, component mapping and lint-gate practices | Don't claim its linter has run; this package was authored separately |
| [Anti-slop repository](https://github.com/miqdadbadjuber/anti-slop) | Quality filter, 38 rules, liveliness direction and delivery gate; paired with a product-specific `DESIGN.md` | Include a root `DESIGN.md` + `AGENTS.md` pointer and a PASS/FAIL QA gate | Anti-slop does not prescribe a visual style and is not a replacement for design direction |
| [UIverse](https://uiverse.io/) | Component ideas | Source tiny interaction patterns if they provide function and accessibility | No copied ornamental CSS toys or components without product fit |
| [Transitions.dev](https://transitions.dev/) | Transition/animation references | Short, state-based transitions only | No motion for its own sake |
| [Beautiful UI](https://www.beautifului.dev/) / [Motion Primitives](https://motion-primitives.com/) / [UI Layouts](https://www.ui-layouts.com/) | Component and motion ideas | Use as pattern checks for behaviors such as disclosure, input, loading or focus | No generic animated backgrounds/cards on finance screens |
| [NEAT](https://neat.firecms.co/) / [Feral UI](https://feralui.dev/gradients) / [PatternCraft](https://patterncraft.store/) | Background/gradient/pattern creation | No generated background in transaction UI; keep page background simple | Not used in prototype because it would distract from money and data |

## Why TOKO MODE is chosen

The user asks for an appearance that feels distinctly different and explicitly repeats “cheap”. In this version, this is interpreted as **accessible/value-retail energy**—bold orange, lime and blue, firm outlines, direct microcopy, tactile buttons, and high utility density—rather than intentionally low-quality or hard-to-read UI. Trust is maintained by disciplined type, precise labels, restrained motion, and honest transaction states.

This is a design interpretation, not a measured 95% difference. The visual language, information rhythm, navigation presentation, forms and components are materially changed from the previous concept, while business rules stay locked.

## Key product constraints preserved

- Sales, received money, cash available and expected handover are separate concepts.
- Stock items keep their actual unit; unlike units are not added as if comparable.
- Unknown modal remains unknown; missing input is not zero.
- A stock/sale price spread is not itself period profit.
- Corrections to a closed period are linked correction records; no silent rewrite.
- UI preview does not claim a transaction was saved.
