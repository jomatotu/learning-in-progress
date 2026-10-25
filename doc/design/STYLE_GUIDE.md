# Style guide: Morph

Everything needed to rebuild the Morph look in any project: colours, type, spacing, components, and the rules behind them. Every value here comes from the live code:

- Main site (`/`): [client/src/features/onboarding/onboarding.css](../../client/src/features/onboarding/onboarding.css)
- Application page (`/application`): [client/src/features/application/application.css](../../client/src/features/application/application.css)

If this guide and the code disagree, the code wins. Update this file.

---

## 1. The feel in one paragraph

Calm, warm, and editorial. A cream page, near-black ink, and one confident purple. Headlines are big, tight, and sans-serif, with one or two words switched to a purple serif for emphasis. Surfaces are white cards with hairline borders and soft, wide, low-opacity shadows. Decoration is soft and organic: blobs, thin orbit rings, pastel tiles. Nothing is loud: no gradients on text, no neon, no heavy borders.

**Five rules that make it recognisable**

1. Cream background `#f7f5ef`, never pure white for the page.
2. One accent: purple `#6955c6`. Coral and mint appear only as small secondary dots.
3. Headlines in DM Sans 600 with tight negative tracking, plus a Fraunces `<em>` in purple.
4. White cards, 1px warm-grey border, big soft shadow.
5. The primary button is dark ink and turns purple on hover.

---

## 2. Colour

### Core

| Role | Hex | Used for |
| --- | --- | --- |
| Page background | `#f7f5ef` | Every page (`--lip-bg`) |
| Ink | `#292632` | Primary buttons, dark panels, strong text (`--lip-ink`) |
| Body text | `#1f1d2b` | Default text colour on the page |
| Accent purple | `#6955c6` | Emphasis words, kicker labels, focus, active borders, progress (`--lip-accent`) |
| Accent hover / deep | `#5540b0` | Text on light purple, selected chip text |
| White | `#ffffff` | Cards, inputs on dark |

### Purple family

| Hex | Used for |
| --- | --- |
| `#f0ecfb` | Selected chip background, light purple wash, radial glow |
| `#eeeafb` / `#eeeafa` | Input focus ring, mic button background |
| `#ece7fb` / `#ebe5ff` | Radial glows behind centred screens |
| `#e9e3fb` / `#dfd8f6` | Pastel "plum" tile, hero blob |
| `#ccc5e7` / `#c8c1dc` | Orbit rings, dashed dropzone border |
| `#bcb0f2` | `<em>` on the dark panel |
| `#b3a9dc` | Large serif numbers (`.number`) |
| `#806bd9` → `#5743ae` | The one gradient: the floating "magic" icon tile, 145deg |

### Secondary accents (small doses only)

| Name | Hex | Used for |
| --- | --- | --- |
| Coral | `#e67f63` | Brand-mark bar, small particles, the "listening" mic |
| Coral text | `#e1765b` | `.step-overline` labels |
| Mint | `#89b6a1` | Brand-mark bar, small particles |

### Greys (warm, slightly purple)

| Hex | Used for |
| --- | --- |
| `#63606b` | Hero paragraph |
| `#686572` / `#6d6874` | Help button, text buttons |
| `#706b78` / `#77727d` | Secondary paragraphs |
| `#777380` / `#8c8891` / `#8b8790` | Small meta text, counters |
| `#98939e` / `#99959d` / `#a19da5` | Tiny labels, "optional" notes |

### Borders and surfaces

| Hex | Used for |
| --- | --- |
| `#dedbd2` | Top bar bottom border |
| `#e5e1d9` / `#e2ded6` / `#dedad2` | Card borders |
| `#d9d5cc` / `#ddd8d0` / `#d3d0c7` | Input, chip, and help-button borders |
| `#e1ded7` / `#eeeae3` | Dividers inside cards |
| `#e1ded5` | Empty progress track |
| `#faf9f5` / `#fbfaf7` | Chip and input fill (slightly warmer than white) |
| `#f0ede7` | Neutral round markers |

### Pastel tile pairs (background / foreground)

Use these for illustrated tiles, tags, and category colour. Always pair them; never use the foreground on another background.

| Name | Background | Foreground |
| --- | --- | --- |
| Plum | `#e9e3fb` | `#6955c6` |
| Blue | `#e3eef5` | `#47718a` |
| Mint | `#e3f0e9` | `#47735e` |
| Peach | `#f8e7df` | `#b2644f` |
| Lavender | `#eee8f7` | `#755899` |
| Yellow | `#f7efce` | `#8c742a` |
| Callout (mint) | `#e9f1ed` | `#4e6259` |

### Dark panel

| Hex | Used for |
| --- | --- |
| `#292632` | Panel background |
| `#bbb8c2` | Paragraphs on dark |
| `#d9d5df` | Tag text on dark |
| `#575260` / `#504b61` | Tag borders, decorative ring on dark |

### Dark mode

Every page has a dark version, switched with the sun / moon button in the top bar. It follows the device setting until the student picks one, and the choice is remembered. The class `dark` on `<html>` turns it on; all dark colours live in [client/src/styles/theme.css](../../client/src/styles/theme.css). Layout, type, and spacing never change, only colours.

| Role | Light | Dark |
| --- | --- | --- |
| Page | `#f7f5ef` | `#14121a` |
| Card / surface | `#ffffff` | `#1d1a25` |
| Raised (chips) | `#faf9f5` | `#252131` |
| Input field | `#fbfaf7` | `#18161f` |
| Border | `#e5e1d9` | `#2f2a3b` |
| Strong border | `#d9d5cc` | `#3d3750` |
| Headings | `#292632` | `#eeebf5` |
| Body text | `#1f1d2b` | `#d6d2e0` |
| Muted text | `#77727d` | `#a6a1b3` |
| Faint text | `#98939e` | `#827d90` |
| Accent (text, borders, focus) | `#6955c6` | `#9b88f2` |
| Accent fill (circles, particles) | `#6955c6` | `#7a66d6` |
| Accent soft (selected) | `#f0ecfb` | `rgba(155, 136, 242, 0.14)` |
| Accent deep (text on soft) | `#5540b0` | `#cfc4fb` |
| Coral | `#e67f63` | `#ec8c72` |
| Mint | `#89b6a1` | `#8fc0aa` |
| Card shadow | `0 24px 70px rgba(60, 53, 88, 0.08)` | `0 24px 70px rgba(0, 0, 0, 0.45)` |

Rules for dark:

- **The primary button inverts:** light `#eeebf5` with dark text, turning purple `#9b88f2` on hover. Never a dark button on a dark page.
- **Purple gets brighter** (`#9b88f2`) so text and borders keep their contrast; filled circles use the slightly deeper `#7a66d6`.
- **Shadows are black and stronger**, because tinted shadows disappear on dark.
- **Pastel tiles become deep tints** with light text: plum `#2a2342` / `#b9aaf6`, blue `#1d2a33` / `#8fb5cc`, mint `#1d2b25` / `#8fc0aa`, peach `#33231e` / `#e5a28c`, lavender `#2a2235` / `#c2a5e3`, yellow `#2f2a1a` / `#d8c07a`.
- **Glows and blobs** use `#2a2342` / `#241f36` instead of the light lavender.
- New colours go into `theme.css` next to the light ones, never as fixed hex in components. In Tailwind, use `dark:` variants (`dark:bg-[#1d1a25]`).

---

## 3. Typography

### Fonts

| Font | Package | Role |
| --- | --- | --- |
| **DM Sans Variable** | `@fontsource-variable/dm-sans` | Everything: headlines, body, UI |
| **Fraunces Variable** | `@fontsource-variable/fraunces` | Only `<em>` emphasis and big decorative numbers |

```css
@import '@fontsource-variable/dm-sans';
@import '@fontsource-variable/fraunces';

.app-shell { font-family: 'DM Sans Variable', sans-serif; }
.app-shell em { font-family: 'Fraunces Variable', serif; color: #6955c6; font-weight: 600; }
```

Google Fonts alternative: `DM Sans` (400, 500, 600, 700) and `Fraunces` (600, italic 600).

### The emphasis pattern

Every big headline has one to three words wrapped in `<em>`. The browser's default italic stays on, so it renders as purple Fraunces italic.

```html
<h1>Dein Wissen.<br /><em>Deine Form.</em></h1>
<h2>Who are we <em>learning with?</em></h2>
```

One `<em>` per headline, at the end, never in body text.

### Type scale

| Style | Size | Weight | Line height | Letter spacing | Colour |
| --- | --- | --- | --- | --- | --- |
| Hero H1 | `clamp(60px, 7.5vw, 108px)` (58px under 560px) | 600 | 0.91 | -0.065em | ink |
| Magic H1 | `clamp(54px, 8vw, 105px)` | 600 | 0.94 | -0.065em | ink |
| Panel H2 (dark) | `clamp(42px, 5vw, 68px)` | 600 | 1.02 | -0.05em | white |
| Section H2 | `clamp(35px, 4vw, 52px)` | 600 | 1.08 | -0.045em | ink |
| Application H2 | 1.9rem, 2.2rem from 768px (root 17px) | 600 | 1.08 | -0.04em | ink |
| H3 | 38px | 600 | default | -0.04em | ink |
| Hero paragraph | 19px | 400 | 1.65 | 0 | `#63606b` |
| Body | 17px | 400 | 1.6–1.7 | 0 | `#1f1d2b` / `#77727d` |
| UI text, buttons | 14–16px | 600 | 1.4 | 0 | – |
| Card label | 13px | 600 | 1.4 | 0 | ink |
| Small meta | 12px | 400 | 1.4 | 0 | `#777380`–`#8c8891` |
| Kicker | 12px | 700 | 1.4 | 0.08em, UPPERCASE | `#6955c6` |
| Step overline | 11px | 700 | 1.4 | 0.12em, UPPERCASE | `#e1765b` |
| Field label | 12px | 700 | 1.4 | 0 | ink |
| Tiny caption | 10–11px | 400–700 | 1.4 | 0.1em when uppercase | `#98939e` |
| Big serif number | 24px Fraunces | 400 | – | 0 | `#b3a9dc` |

Rules: headlines are always sans with negative tracking; labels are tiny uppercase with positive tracking; body text never goes below 12px on the main site or 15px on the application page.

---

## 4. Layout and spacing

| Thing | Value |
| --- | --- |
| Top bar height | 78px |
| Top bar side padding | `clamp(24px, 5vw, 72px)`, 18px under 560px |
| Screen height | `min-height: calc(100vh - 78px)` |
| Hero container | max 1240px, padding `60px 50px 80px`, 2 columns, gap 70px |
| Content container | max 1120px (application), 1080px (card grids) |
| Centred card | `width: min(680px, 100%)` |
| Text column | 570–600px max |
| Card grid | 3 columns, gap 18px; 2 under 850px; 1 under 560px |
| Card padding | `clamp(32px, 5vw, 58px)`; 30px 20px on phones |
| Element gaps | 8px (chips), 10–14px (icon + text), 18–34px (between blocks) |

### Breakpoints

| Width | Change |
| --- | --- |
| ≤ 850px | Hero and split screens become one column; card grid 2 columns |
| ≤ 768px | Application form side panel stacks under the form |
| ≤ 560px | Tighter top bar, step label hidden, hero art scaled to 0.8, card grid 1 column |

---

## 5. Shape, borders, and shadows

### Corner radius

| Radius | Used for |
| --- | --- |
| 50% | Help button, mic, round markers, avatar centres |
| 26px | Magic icon tile |
| 22px | Small floating icon tiles |
| 20px | Main cards, chips and pills |
| 18px | Selection cards |
| 16px | Summary cards |
| 14px | Floating art cards, sticky action bar |
| 12px | Inputs, dropzone, callouts, inner tiles, big buttons |
| 10px | Primary button |
| 8px | Small tags, brand-mark bars |
| 4px | Progress bar |

### Borders

Always 1px, always warm grey (`#e5e1d9` family). The only exceptions:

- **Active selection:** 2px solid `#6955c6` (reduce padding by 1px so the size doesn't jump).
- **Dropzone:** 1px dashed `#c8c1dc`.

### Shadows

All shadows are soft, wide, low-opacity, and tinted purple-grey, never black.

| Name | Value | Used for |
| --- | --- | --- |
| Card | `0 24px 70px rgba(60, 53, 88, 0.08)` | Main cards |
| Summary card | `0 18px 55px rgba(52, 45, 78, 0.07)` | Brief / summary cards |
| Hover lift | `0 16px 36px rgba(45, 39, 67, 0.1)` | Cards on hover |
| Active | `0 12px 30px rgba(105, 85, 198, 0.12)` | Selected card |
| Floating | `0 15px 35px rgba(47, 40, 75, 0.12)` | Small floating cards |
| Sticky bar | `0 14px 40px rgba(41, 35, 65, 0.14)` | Bottom action bar |
| Button | `0 7px 18px rgba(41, 38, 50, 0.13)` | Primary button |
| Big button | `0 12px 30px rgba(41, 38, 50, 0.2)` | Magic button |
| Purple glow | `0 25px 60px rgba(73, 55, 154, 0.28)` | Purple circles and tiles |

### Glass

Used only on things that float above content:

```css
background: rgba(247, 245, 239, 0.92); backdrop-filter: blur(10px); /* top bar */
background: rgba(255, 255, 255, 0.94); backdrop-filter: blur(10px); /* sticky bar */
```

---

## 6. Backgrounds and decoration

- **Radial glow** behind centred screens:
  `radial-gradient(circle at 50% 45%, #f0ecfb, transparent 38%)`
- **Full glow** for the final "magic" screen:
  `radial-gradient(circle at 50% 45%, #ebe5ff 0, #f7f5ef 43%, #f1eee7 100%)`
- **Blob:** a 390px shape in `#dfd8f6`, `border-radius: 43% 57% 62% 38% / 46% 38% 62% 54%`, slowly morphing.
- **Orbit rings:** 1px `#ccc5e7` (or `rgba(105, 85, 198, 0.16)`), ellipses rotated ±14–23deg.
- **Particles:** small circles in purple, coral, and mint, gently floating.
- **Ruled paper** (application profile panel): `repeating-linear-gradient(#fff 0 31px, #f0ecfb 31px 32px)`.

Decoration is always `aria-hidden` and never carries information.

---

## 7. Motion

| What | Value |
| --- | --- |
| Button hover | `transform 0.2s, background 0.2s`; lift `translateY(-2px)` |
| Card hover | `0.2s`; lift `translateY(-4px)` |
| Progress fill | `width 0.4s ease` |
| Blob | `morph 9s ease-in-out infinite` |
| Floating icons | `float 3–4s ease-in-out infinite` (up 12px, rotate 4deg) |
| Listening mic | `pulse 1.2s infinite` (coral halo) |

```css
@keyframes morph { 50% { border-radius: 60% 40% 35% 65% / 40% 58% 42% 60%; transform: rotate(8deg); } }
@keyframes float { 50% { transform: translateY(-12px) rotate(4deg); } }
@keyframes pulse { 50% { box-shadow: 0 0 0 8px rgba(230, 127, 99, 0.16); } }
```

Always switch animations off under `prefers-reduced-motion: reduce`.

---

## 8. Icons and brand mark

- **Icons:** [lucide](https://lucide.dev) (`lucide-react`), outline style. 16px in labels, 18px in buttons, 24–34px as illustrations. They inherit text colour.
- **Brand mark:** three rounded bars, 7px wide, gap 2px, the group rotated -8deg, aligned to the bottom:

| Bar | Height | Colour |
| --- | --- | --- |
| 1 | 14px | `#6955c6` purple |
| 2 | 24px | `#e67f63` coral |
| 3 | 18px | `#89b6a1` mint |

- **Wordmark:** "morph", lowercase, DM Sans 700, 21px, letter-spacing -0.6px, `#22202d`, 10px after the mark.

```html
<a class="brand" href="/">
  <span class="brand-mark"><span></span><span></span><span></span></span>
  <span>morph</span>
</a>
```

---

## 9. Components

Copy these as-is. Class names match the code.

### Top bar

```css
.topbar {
  height: 78px; padding: 0 clamp(24px, 5vw, 72px);
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid #dedbd2;
  background: rgba(247, 245, 239, 0.92); backdrop-filter: blur(10px);
  position: relative; z-index: 20;
}
```

Left: brand. Middle (optional): stepper. Right: round help button or page controls.

**Stepper:** 12px `#777380` text "Schritt 2 von 6" plus a 120px × 4px track `#e1ded5` with a `#6955c6` fill.

**Help button:** 32px circle, 1px `#d3d0c7` border, transparent, `?` in `#686572` weight 600.

### Kicker and overline

```css
.kicker { display: inline-flex; align-items: center; gap: 8px; color: #6955c6;
  font-weight: 700; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; }
.step-overline { color: #e1765b; text-transform: uppercase; font-size: 11px;
  letter-spacing: 0.12em; font-weight: 700; }
```

The kicker sits above every main heading, often with a 16px icon.

### Buttons

```css
.primary {
  border: 0; border-radius: 10px; background: #292632; color: #fff;
  padding: 14px 19px; display: inline-flex; align-items: center; justify-content: center; gap: 12px;
  font-weight: 600; box-shadow: 0 7px 18px rgba(41, 38, 50, 0.13);
  transition: transform 0.2s, background 0.2s;
}
.primary:hover { transform: translateY(-2px); background: #6955c6; }
.primary.large { padding: 17px 23px; font-size: 16px; }
.primary.full { width: 100%; margin-top: 20px; }
.primary:disabled { cursor: not-allowed; opacity: 0.45; transform: none; background: #292632; }

.text-button { border: 0; background: none; color: #6d6874; padding: 12px; }

.secondary-button { /* application page */
  display: inline-flex; align-items: center; gap: 8px;
  border: 1px solid #d9d5cc; border-radius: 10px; background: #fff; color: #292632;
  padding: 10px 16px; font-size: 14px; font-weight: 600;
}
.secondary-button:hover { border-color: #6955c6; color: #5540b0; }
```

- Primary always ends with an arrow icon (`ArrowRight`, 18px).
- Use one primary per screen. "Back" and "Skip" are text buttons.
- Under the hero button, add a 12px `#8b8790` note ("Dauert etwa 4 Minuten · Keine Vorkenntnisse nötig").

### Chips (pill choices)

```css
.chip { padding: 10px 13px; border-radius: 20px; border: 1px solid #ddd8d0;
  background: #faf9f5; color: #595560; font-size: 12px; }
.chip:hover, .chip.selected { border-color: #6955c6; background: #f0ecfb; color: #5540b0; }
```

On the application page chips are a bit bigger (0.88rem, `px-4 py-2`) and show a check icon when selected.

### Text inputs

```css
textarea, .topic-input {
  width: 100%; resize: none; border: 1px solid #d9d5cc; border-radius: 12px;
  padding: 17px; min-height: 105px; background: #fbfaf7; outline: none;
}
textarea:focus, .topic-input:focus { border-color: #6955c6; box-shadow: 0 0 0 3px #eeeafb; }
```

Single-line inputs: same style, `min-height: 48px`, `padding: 12px 16px`. Field labels are 12px weight 700 above the field, with 8px gap.

**Mic button inside a textarea:** 36px circle at bottom right (12px inset), `#eeeafa` background, `#6955c6` icon; when listening, `#e67f63` with the pulse animation.

### Dropzone

```css
.dropzone { width: 100%; border: 1px dashed #c8c1dc; border-radius: 12px; background: #f7f4fd;
  color: #6955c6; display: flex; justify-content: center; align-items: center; gap: 14px; padding: 21px; }
.dropzone small { color: #8d8894; font-size: 11px; margin-top: 4px; }
```

### "Or" divider

```css
.or { display: flex; align-items: center; gap: 10px; margin: 18px 0;
  color: #a19da5; font-size: 11px; }
.or::before, .or::after { content: ''; height: 1px; background: #e1ded7; flex: 1; }
```

### Main card (centred question)

```css
.dialog-card { width: min(680px, 100%); text-align: center; background: #fff;
  padding: clamp(32px, 5vw, 58px); border-radius: 20px; border: 1px solid #e5e1d9;
  box-shadow: 0 24px 70px rgba(60, 53, 88, 0.08); }
```

Order inside: counter ("Frage 2 / 5", 12px, above the card) → kicker → H2 with `<em>` → grey hint → chips → textarea → actions row (text button left, primary right).

### Summary card with numbered rows

```css
.brief-card { background: #fff; border: 1px solid #e2ded6; border-radius: 16px; padding: 5px 30px;
  box-shadow: 0 18px 55px rgba(52, 45, 78, 0.07); }
.brief-row { display: grid; grid-template-columns: 42px 1fr; gap: 15px; padding: 24px 0;
  border-bottom: 1px solid #eeeae3; }
.brief-row:last-child { border: 0; }
.number { font-family: 'Fraunces Variable', serif; font-size: 24px; color: #b3a9dc; }
.brief-row small { text-transform: uppercase; font-size: 10px; font-weight: 700;
  color: #98939e; letter-spacing: 0.1em; }
```

### Callout

```css
.callout { display: flex; align-items: center; gap: 15px; padding: 16px 20px; border-radius: 12px;
  background: #e9f1ed; color: #4e6259; }
.callout p { margin: 0; font-size: 13px; line-height: 1.5; }
```

### Dark panel (split screen)

```css
.profile-panel { background: #292632; color: #fff; padding: 10vw; display: flex;
  flex-direction: column; justify-content: center; position: relative; overflow: hidden; }
.profile-panel::after { content: ''; position: absolute; width: 380px; height: 380px;
  border: 1px solid #504b61; border-radius: 45%; right: -190px; bottom: -180px; }
.profile-panel em { color: #bcb0f2; }
.profile-panel > p { color: #bbb8c2; line-height: 1.7; font-size: 17px; max-width: 500px; }
.profile-tags span { border: 1px solid #575260; border-radius: 20px; padding: 9px 13px;
  font-size: 12px; color: #d9d5df; }
```

The other half is a light panel (`padding: clamp(50px, 8vw, 120px)`, max 720px) with an overline, H3, and the form.

### Selection cards

```css
.solution-card { border: 1px solid #dedad2; background: #fff; border-radius: 18px;
  padding: 10px 10px 16px; position: relative; overflow: hidden; transition: 0.2s; }
.solution-card:hover { transform: translateY(-4px); box-shadow: 0 16px 36px rgba(45, 39, 67, 0.1); }
.solution-card.active { border: 2px solid #6955c6; padding: 9px 9px 15px;
  box-shadow: 0 12px 30px rgba(105, 85, 198, 0.12); }
.select-mark { width: 25px; height: 25px; border-radius: 50%; display: grid; place-items: center;
  background: #f0ede7; color: #6955c6; font-weight: 700; }
.solution-card.active .select-mark { background: #6955c6; color: #fff; }
```

Top of the card: a 145px pastel tile (one of the tile pairs) with a white rounded icon square (70px, radius 22px, `rgba(255,255,255,0.72)`), a faint ring, and 7px "text line" bars at 16% opacity. A tiny glass tag (8px uppercase) sits in the top-right corner.

### Sticky action bar

```css
.sticky-action { position: fixed; z-index: 10; bottom: 20px; left: 50%; transform: translateX(-50%);
  width: min(700px, calc(100% - 30px)); border: 1px solid #dedad2; border-radius: 14px;
  padding: 11px 12px 11px 20px; background: rgba(255, 255, 255, 0.94); backdrop-filter: blur(10px);
  box-shadow: 0 14px 40px rgba(41, 35, 65, 0.14); display: flex; align-items: center;
  justify-content: space-between; font-size: 12px; }
```

Summary text left ("2 ausgewählt"), primary button right. On phones the text hides and the button goes full width.

### Floating art card

```css
.art-card { position: absolute; background: rgba(255, 255, 255, 0.9); border: 1px solid #fff;
  box-shadow: 0 15px 35px rgba(47, 40, 75, 0.12); border-radius: 14px; padding: 14px 17px;
  display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 600; }
```

### Format pills (glass, on a glow)

```css
.magic-formats span { display: flex; align-items: center; gap: 7px; padding: 8px 12px;
  border: 1px solid rgba(105, 85, 198, 0.18); border-radius: 20px;
  background: rgba(255, 255, 255, 0.55); color: #5f557f; font-size: 11px; backdrop-filter: blur(8px); }
```

### Application page additions

These live in `application.css` and follow the same rules.

- **Form card:** white, 20px radius, 1px `#e5e1d9` border, card shadow. Header row with "Step 2 of 5 · About you · about 3 minutes left", a segmented progress bar, and "Saved".
- **Segmented progress:** 2.25rem × 0.375rem rounded bars (about 38 × 6px at the page's 17px root); done = purple, current = coral `#e1765b`, todo = `#e5e1d9`.
- **Rating scale (1–5):** five equal tiles in a grid, 12px radius, 1px border, number on top (weight 500) and a tiny label under it. Selected = purple border and `#f0ecfb` fill.
- **Side panel:** ruled-paper background, sticky on desktop, small grey uppercase labels (`.label`: 12px, 700, 0.08em, `#8c8891`).
- **Tags for the student's own data:** 8px radius, 1px purple border, `#f0ecfb` fill, `#5540b0` text.
- **Error message:** 3px coral left border, 12px left padding, ink text. Never red.
- **Focus:** `outline: 3px solid #6955c6; outline-offset: 2px` on every focusable element.

---

## 10. Screen layouts

| Layout | Structure | Example |
| --- | --- | --- |
| **Hero** | Two columns: copy (kicker, H1 with `<em>`, paragraph, primary, note) and an illustration (blob, orbits, floating cards, purple centre circle) | Home (`/`) |
| **Centred question** | Radial glow, counter, one centred card | Onboarding dialog |
| **Split** | Dark panel left with the result, light panel right with the next input | Topic step |
| **Summary** | Centred title, numbered summary card, mint callout, primary | Brief |
| **Choice grid** | Centred heading, 3-column selection cards, sticky action bar | Solutions |
| **Celebration** | Full glow, floating icon tile, huge H1, glass pills, big dark button, orbits and particles | Magic |
| **Form with side panel** | Card with a header row; form on the left (wider), live summary on the right | Application (`/application`) |

---

## 11. Accessibility

- Text contrast at least WCAG AA. Light greys (`#98939e` and lighter) only for non-essential captions.
- One `h1` per page; the application page has a visually hidden one.
- Every interactive element is a real `button`, `a`, or input. Choices use `aria-pressed`, ratings use radio inputs, icon-only buttons have `aria-label`.
- Visible focus ring (see the application page rule).
- Decoration is `aria-hidden`.
- Respect `prefers-reduced-motion`.
- Every page has a DE | EN language switch in the top bar (`client/src/components/LanguageToggle.tsx`): a small pill with the active language filled in ink `#292632`.
- Next to it, a 32px round sun / moon button (`client/src/components/ThemeToggle.tsx`) switches light and dark mode, styled like the help button.

---

## 12. Voice and copy

- The main site is in **German** and uses **du**. The application page is in **English** and uses "you".
- Short, warm, direct sentences. Talk about the learner, not the product.
- Headlines: a plain statement plus an emphasised turn ("Dein Wissen. *Deine Form.*").
- Kickers name the moment: "Lernen, das zu dir passt", "Jetzt zu deinem Thema".
- Buttons are verbs with an arrow: "Los geht's →", "Weiter →", "Continue →".
- Reassurance under the main action: time needed, no prior knowledge needed, optional fields.

---

## 13. Do and don't

| Do | Don't |
| --- | --- |
| Cream page, white cards | White page, grey cards |
| One purple accent per screen | Several bright colours competing |
| `<em>` in Fraunces purple for 1–3 words | Bold or underlined emphasis in headlines |
| 1px warm borders, soft wide shadows | Thick borders, hard or black shadows |
| Dark ink primary that turns purple | Purple primary buttons, gradient buttons |
| Pastel tiles in fixed pairs | Mixing tile colours with other text colours |
| Organic decoration, aria-hidden | Decoration that carries meaning |
| Coral for errors and small accents | Red error states |

---

## 14. Starter tokens

Paste this into any project to get the base look, then add components from section 9.

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:ital,wght@0,600;1,600&display=swap');

:root {
  --lip-bg: #f7f5ef;
  --lip-ink: #292632;
  --lip-text: #1f1d2b;
  --lip-accent: #6955c6;
  --lip-accent-deep: #5540b0;
  --lip-accent-soft: #f0ecfb;
  --lip-coral: #e67f63;
  --lip-mint: #89b6a1;
  --lip-muted: #77727d;
  --lip-border: #e5e1d9;
  --lip-input-border: #d9d5cc;
  --lip-input-bg: #fbfaf7;
  --lip-card-shadow: 0 24px 70px rgba(60, 53, 88, 0.08);
  --lip-button-shadow: 0 7px 18px rgba(41, 38, 50, 0.13);
  --lip-radius-card: 20px;
  --lip-radius-input: 12px;
  --lip-radius-button: 10px;
}

body {
  margin: 0;
  background: var(--lip-bg);
  color: var(--lip-text);
  font-family: 'DM Sans', 'DM Sans Variable', sans-serif;
}

h1, h2, h3 { font-weight: 600; letter-spacing: -0.045em; line-height: 1.08; }
em { font-family: 'Fraunces', 'Fraunces Variable', serif; color: var(--lip-accent); font-weight: 600; }

.card {
  background: #fff;
  border: 1px solid var(--lip-border);
  border-radius: var(--lip-radius-card);
  box-shadow: var(--lip-card-shadow);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```
