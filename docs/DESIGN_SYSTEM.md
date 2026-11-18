# Rehydria Platform — Design System

> Status: **Implemented (Phase 2)** · Last updated: 2026-11-17 · Live reference: `/design`

Direction: **"Living circuit, editorial calm."** A light, warm-neutral canvas with deep
forest greens. Large editorial type, precise hairlines, and technical details drawn from
circuitry: traces, solder pads, oscilloscope lines, grid paper. It should feel like a premium
engineering studio, not an e-learning template.

---

## 1. Color tokens

Defined as CSS variables in `src/app/globals.css` and exposed to Tailwind 4 via `@theme`.

| Token | Hex | Use |
|---|---|---|
| `--color-canvas` | `#F6F7F4` | Page background (never pure white pages) |
| `--color-canvas-2` | `#EEF2ED` | Alternating sections, sidebar, inputs |
| `--color-surface` | `#FFFFFF` | Cards, popovers, modals |
| `--color-forest` | `#173F35` | Primary: CTAs, dark sections, headings accents |
| `--color-forest-deep` | `#0F2E26` | Primary hover / pressed, footer |
| `--color-moss` | `#367A65` | Secondary green: links, active nav, progress, text ≥ 18px |
| `--color-moss-text` | `#2E6B57` | Moss for small text (eyebrows, mono labels): 5.8:1 canvas, 5.5:1 canvas-2 |
| `--color-mint` | `#B8E4C9` | Accent: highlights, badges, focus glow, chart accent |
| `--color-mint-soft` | `#DDF2E5` | Tinted backgrounds, selected rows |
| `--color-ink` | `#18251F` | Main text |
| `--color-ink-soft` | `#5E6A62` | **Body-small/secondary text** (5.3:1 on canvas, AA) |
| `--color-mute` | `#758078` | Brand secondary text: **≥ 18px or non-essential only** (3.8:1) |
| `--color-line` | `#DDE3DC` | Hairline borders |
| `--color-line-strong` | `#C5CFC4` | Input borders, dividers on canvas-2 |
| `--color-success` | `#367A65` | |
| `--color-warning` | `#A15C07` | |
| `--color-danger` | `#B42318` | |
| `--color-info` | `#2F5D8A` | |

Contrast checks (WCAG 2.2):

| Pair | Ratio | Verdict |
|---|---|---|
| ink on canvas | 14.8 | AAA |
| white on forest | 11.7 | AAA |
| white on moss | 5.1 | AA |
| forest on mint | 8.3 | AAA |
| ink-soft on canvas / canvas-2 | 5.3 / 5.0 | AA |
| mute on canvas | 3.8 | AA-large only, so never used for body copy |

Gradients are used sparingly and always low-chroma:
- `--gradient-aurora`: radial mint (`#B8E4C9` @ 35%) + moss (`#367A65` @ 12%) blobs on canvas. Hero and final CTA only; slowly drifts.
- `--gradient-forest`: `#173F35 → #0F2E26` for dark feature panels.

The theme is **light only**. Dark sections (forest panels, footer) are inverted islands with
their own on-dark text tokens (`--color-on-forest: #F6F7F4`, `--color-on-forest-soft: #B8C9BF`).

## 2. Typography

| Role | Family | Loaded via | Notes |
|---|---|---|---|
| Display & UI | **Geist Sans** | `next/font/google` (variable) | Headlines at weight 500–600, tracking `-0.035em` |
| Editorial accent | **Instrument Serif** (italic) | `next/font/google` | One or two words per hero/section headline, e.g. "Where Technology *Meets* Innovation" |
| Technical labels | **Geist Mono** | `next/font/google` | Eyebrows, module numbers (`MODULE 01`), IDs, stats units, code |

Fluid scale (`clamp()`; min at 360px, max at 1440px):

| Token | Size | Line height | Use |
|---|---|---|---|
| `text-display-xl` | 56 → 128px | 0.92 | Hero headline |
| `text-display-lg` | 44 → 88px | 0.95 | Section statements |
| `text-display-md` | 36 → 60px | 1.0 | Section headings |
| `text-h1` | 32 → 44px | 1.1 | Page titles (dashboard) |
| `text-h2` | 26 → 32px | 1.15 | |
| `text-h3` | 20 → 24px | 1.25 | Card titles |
| `text-body-lg` | 18 → 20px | 1.55 | Lead paragraphs |
| `text-body` | 16px | 1.6 | |
| `text-sm` | 14px | 1.5 | |
| `text-eyebrow` | 12px mono, uppercase, tracking `0.14em` | | Section eyebrows: `[ 02 — PROGRAMS ]` |

Editorial rules: maximum measure 68ch; headlines balance with `text-wrap: balance`;
paragraphs use `text-wrap: pretty`.

## 3. Space, layout, shape

- **Spacing** base 4px; section padding `clamp(96px, 12vw, 200px)` vertically.
- **Grid**: 12 columns, `max-width: 1440px`, gutters `clamp(16px, 3vw, 40px)`. Mobile side gutter 16px; no horizontal page scroll at any width.
- **Asymmetry**: section headings sit on columns 1–5 and content on 6–12, or the reverse. Avoid centered-everything.
- **Radius** (restrained): `--radius-xs 4px` (badges), `--radius-sm 8px` (inputs, small cards),
  `--radius-md 14px` (cards, modals), `--radius-pill 999px` (primary CTAs and chips only).
- **Borders**: 1px `--color-line`. Cards rely on hairline plus a subtle shadow, never heavy fills.
- **Shadows** (green-tinted, layered):
  - `--shadow-xs`: `0 1px 2px rgb(23 63 53 / .06)`
  - `--shadow-card`: `0 1px 2px rgb(23 63 53 / .05), 0 8px 24px -12px rgb(23 63 53 / .12)`
  - `--shadow-float`: `0 24px 60px -24px rgb(23 63 53 / .28)`
- **Glass** (navigation bar, floating stat chips only): `background: rgb(246 247 244 / .72); backdrop-filter: blur(14px) saturate(140%); border: 1px solid rgb(255 255 255 / .6)`.
- **Texture**: a 24px dotted "engineering grid" (`radial-gradient` dots at 6% ink), masked to fade at edges. Used in the hero, the methodology section and dashboard empty states.

## 4. Iconography & imagery

- Lucide icons, 1.5px stroke, sized 16/20/24.
- **Custom SVG illustrations** in-house: PCB trace networks, an animated Arduino-style board
  silhouette, sensor node constellations, and oscilloscope waveforms. They are drawn as SVG
  paths so GSAP can stroke-draw them (`stroke-dasharray`).
- Photography (when supplied by Rehydria) is shown inside clip-path masks (rounded-rect,
  pill or a chamfered-corner "chip" shape) with a mint duotone overlay. No generic stock photography.
- Course thumbnails follow a template: canvas-2 background, a large mono course code
  (`IOT-101`), and a line illustration.

## 5. Component inventory (Phase 2)

| Component | Variants / notes |
|---|---|
| `Button` | `primary` (forest pill), `secondary` (outline line-strong), `ghost`, `link`, `mint`; sizes sm/md/lg/icon; `magnetic` prop (desktop-only wrapper); loading state with spinner and `aria-busy` |
| `Card` | `plain`, `interactive` (hover lift 4px + border to moss + tilt on course cards), `feature` (forest island) |
| `Badge` | neutral, mint, success, warning, danger, outline-mono |
| `SectionHeading` | eyebrow (mono index) + display heading with optional serif accent span + lead; `align` start/split |
| `Container`, `Section` | Section accepts `tone="canvas" \| "canvas-2" \| "forest"` |
| `Navbar` | Glass bar that shrinks on scroll, animated active-link pill (Motion `layoutId`), mega-menu for Internships, mobile full-screen sheet with staggered links |
| `Footer` | Forest-deep, giant outlined wordmark "REHYDRIA" revealed on scroll |
| Forms | `Field`, `Input`, `Select`, `PhoneInput (+91)`, `Textarea`, `Checkbox`, `RadioCards` (course choice), RHF bindings, inline error with icon, `aria-describedby` |
| `Dialog` / `Sheet` | Motion presence: scale .96→1 + fade; focus trap; Lenis paused while open |
| `Dropdown`, `Tabs`, `Tooltip`, `Accordion` (FAQ) | shadcn/Radix-based |
| `Skeleton` | shimmer gradient on canvas-2; matches final layout geometry |
| `EmptyState` | engineering-grid backdrop + line illustration + action |
| `Progress` | linear (moss on line) + `ProgressRing` (SVG, animated stroke) |
| `Stat` | big number count-up (GSAP), mono unit, delta badge |
| Dashboard | `Sidebar` (collapsible, animated indicator), `Topbar`, `DataTable` (sort/filter/paginate), `ChartCard` (Recharts, themed) |
| `Price` | formats paise → `₹1,499` via `Intl.NumberFormat('en-IN')` |
| `Toast` | top-right, Motion slide |

All components: forward `className`, use `cn()`, expose `data-state` attributes, keyboard
accessible, focus ring `2px mint + 2px offset forest`.

## 6. Motion language

| Token | Value | Use |
|---|---|---|
| `--ease-out-expo` | `cubic-bezier(.16,1,.3,1)` / GSAP `expo.out` | Reveals |
| `--ease-in-out` | `power3.inOut` | Pinned/scrubbed transitions |
| `--dur-micro` | 160ms | Hover, press |
| `--dur-ui` | 280ms | Menus, tabs, dialogs |
| `--dur-reveal` | 900–1200ms | Text and image reveals |
| Stagger | 0.04s per char-line, 0.08s per card | |

Signature effects (Phase 3), each with a reduced-motion fallback:

1. **Preloader**: the logo mark's circuit traces stroke-draw, the counter runs 0→100 in Geist Mono, then the panel lifts away revealing the hero. Desktop (fine pointer) only, once per session, ~1.9s total; a CSS failsafe hides it after 3s if JavaScript fails.
2. **Hero**: SplitText line-mask reveal of the headline, serif accent word fades/skews in last, aurora gradient drifts, an interactive "circuit board" canvas (R3F on desktop, SVG on mobile) whose traces light up toward the cursor, and floating component chips (ESP32, sensor, LED) in slow parallax.
3. **Scroll text reveals**: words go from 15% to 100% opacity, scrubbed (statement sections).
4. **Image masks**: `clip-path: inset()` reveal combined with an inner scale 1.15→1.
5. **Pinned horizontal scroll**: Programs and Learning methodology timeline (desktop); a vertical stack on mobile.
6. **Stats**: count-up on enter, with a scrubbed underline trace.
7. **Magnetic buttons, course-card tilt and cursor**: a small dot that grows into "View" over cards. Desktop with a fine pointer only.
8. **Dashboard**: sidebar indicator slides with Motion `layoutId`, progress rings draw on mount, charts animate in (Recharts `isAnimationActive` keyed to visibility), skeleton → content crossfade.

Performance rules: animate only `transform`, `opacity`, `clip-path`, and filters on small
areas. `will-change` is applied only while animating. No layout-thrashing reads in tick handlers.
Mobile drops R3F, cursor and magnetic effects, and halves parallax distances.

## 7. Homepage section identities

Each section has its own composition, so the page does not repeat one layout:

| # | Section | Layout | Signature |
|---|---|---|---|
| 1 | Navbar | Floating glass pill, centered | Shrinks and gains a hairline on scroll |
| 2 | Hero | Full-bleed, headline bottom-left at display-xl, visual right | Preloader handoff, circuit canvas, aurora |
| 3 | Company intro | Huge statement paragraph across 10 cols | Scrubbed word-opacity reveal |
| 4 | Stats | 4-up mono numbers on forest island | Count-up + trace underline |
| 5 | Internship programs | Pinned horizontal track of large course cards | Tilt + cursor "View" |
| 6 | Learning methodology | Vertical timeline with SVG trace that draws as you scroll | Stroke-draw linked to scroll |
| 7 | Why Rehydria | Bento grid (asymmetric 3×2) | Staggered card entrance, icon micro-animations |
| 8 | Tech showcase | Dark forest band, oscilloscope wave + component marquee | Parallax layers |
| 9 | Hackathon guide promo | Split: 3D-tilted book mock left, offer right | Mask reveal, price chip float |
| 10 | Testimonials | Approved reviews only, draggable carousel; section hidden if none | |
| 11 | FAQ | Two-column: heading sticky left, accordion right | Height animation |
| 12 | Final CTA | Aurora background, giant serif-accent statement | Magnetic CTA |
| 13 | Footer | Forest-deep, giant wordmark | Wordmark reveal |

## 8. Voice & content

- Confident, clear, practical: "Build a working IoT weather station in week 3", not "Unlock your potential".
- No invented numbers. Statistics on the homepage come from `settings/stats` (real counts);
  until enough data exists, the stats band shows program facts (modules, hands-on projects,
  weeks) sourced from the published courses.
- Company contact details, director name and signature come from `settings/company`; empty
  fields are hidden, never filled with placeholders.

## 9. Accessibility

- WCAG 2.2 AA target. Visible focus everywhere; skip-to-content link.
- `prefers-reduced-motion`: no Lenis, no pinning (sections stack), no SplitText, and instant
  reveals. Count-ups render final values.
- Pinned and horizontal sections keep DOM order equal to the visual order, and all content is reachable by keyboard.
- Custom cursor never replaces the system cursor for text inputs; hidden on touch devices.
- Color is never the only signal (status badges include an icon and text).

## 10. Implementation map (Phase 2)

| Concern | File |
|---|---|
| Tokens (`@theme`), component keyframes, skeleton, grid utility | `src/app/globals.css` |
| Fonts (Geist, Geist Mono, Instrument Serif via `next/font`) | `src/app/layout.tsx` |
| Class merging aware of custom tokens | `src/lib/utils/cn.ts` (extend when adding `@theme` sizes/shadows/radii) |
| GSAP + plugin registration, motion media queries | `src/lib/gsap.ts` |
| Lenis ↔ ScrollTrigger, `useLenis`, `useLenisLock` | `src/components/animations/smooth-scroll-provider.tsx` |
| Motion primitives | `animations/`: `reveal-text` (lines / words / scrub), `reveal` (batched stagger), `mask-reveal`, `magnetic`, `cursor`, `count-up` |
| Primitives | `ui/`: `button`, `card`, `badge`, `input` (Input/Textarea/Label), `field`, `phone-input`, `select`, `choice` (Checkbox/RadioCards), `dialog` (Dialog/Sheet), `accordion`, `tabs`, `overlay-menus` (Tooltip/Dropdown), `feedback` (Skeleton/EmptyState/Progress/ProgressRing), `stat`, `price`, `spinner`, `toaster` |
| Layout | `layout/`: `section` (Container/Section/SectionHeading/Eyebrow/Accent), `logo`, `navbar`, `footer`, `footer-wordmark` |
| Shared form schemas | `src/lib/validations/common.ts` |

Implementation notes:
- Primitives are shadcn-style owned source built on the unified `radix-ui` package. The shadcn CLI
  was not used because its generated CSS variables would duplicate our token system.
- Overlay enter/exit animations are CSS keyframes keyed on Radix `data-state` (`.anim-pop`,
  `.anim-sheet-*`, `.anim-accordion`), so they need no JS and respect reduced motion globally.
  Motion (`motion/react`) is used for shared-layout indicators (navbar, tabs) and the mobile menu stagger.
- Animated text is always server-rendered and visible without JavaScript. Animation is progressive.
- `RevealText` children must be static text (SplitText rewrites its DOM).
- The default logo mark is a neutral placeholder glyph. An uploaded official logo
  (`settings/company.logoPath`) replaces it via the `logoUrl` prop.
