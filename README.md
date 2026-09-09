# Motion Lab

**A recording studio for short animated UI clips, built as a Next.js app.**

Every route in this project is a self-contained animated composition authored
for a fixed **1600 × 900** stage, with a scripted fake cursor that drives real
components through real events. Load a route with `?take=1` and it plays a
deterministic four-second performance you can screen-record — same timing,
same cursor path, same final frame, every time.

It exists because recording UI motion by hand is miserable. You move a real
mouse, you miss the timing, the hover fires late, the take is three pixels off,
and you do it forty times. This replaces that with a system: the cursor is
data, the clock is deterministic, and a headless harness can capture an exact
millisecond of the performance to PNG.

Six reference routes ship with it, each driving a different component library.

---

## Contents

- [What you get](#what-you-get)
- [Setup](#setup)
- [How it works](#how-it-works)
- [Take mode](#take-mode)
- [The synthetic cursor](#the-synthetic-cursor)
- [Capturing frames](#capturing-frames)
- [Customising it](#customising-it)
- [Adding a route](#adding-a-route)
- [Reference routes](#reference-routes)
- [Project layout](#project-layout)
- [Guardrails](#guardrails)
- [Performance](#performance)
- [Licensing — read before forking](#licensing--read-before-forking)

---

## What you get

**A fixed stage.** `DemoShell` builds a 1600 × 900 surface, centres it,
letterboxes the rest of the viewport, locks scrolling in both axes and hides
scrollbars. What you author is exactly what you record.

**A deterministic take system.** One shared `requestAnimationFrame` loop, an
800 ms pre-roll, `TAKE_START` / `TAKE_END` markers on the console, a four-second
ceiling, and an indefinite hold on the final frame. Loop mode resets cleanly;
`R` replays without a reload.

**A synthetic cursor that actually works.** Cursor paths are plain data. The
cursor interpolates along a Catmull-Rom spline with eased segments, writes its
position straight to a transform, and dispatches real mouse and pointer events
at coordinates that match where it is drawn — so third-party components tilt,
glow, hover and respond as if a person were driving them.

**A design system that can't drift.** Six brand tokens, one type scale, and two
lint-time guards that fail the build if anything strays outside them.

**Reusable primitives.** `Surface`, `Sparkline`, `GridField`, `Grain`,
`CornerMarks`, `StatusDot`, `Rule`, `Reveal`, `DelayedMount` — token-only,
prop-driven, route-agnostic.

**A capture harness.** Freeze a route at an exact offset from `TAKE_START` and
write a pixel-perfect 1600 × 900 PNG, with retries when a capture misses its
mark.

---

## Setup

Requires **Node 20+**.

```bash
git clone <your-fork> motion-lab
cd motion-lab

npm install
npm run setup      # required — see below
npm run dev
```

Open <http://localhost:3000>. `/` redirects to `/demos`, the index. Number keys
`1`–`6` jump between routes.

### Why `npm run setup` is required

Two of the five component libraries do not permit their source to be
redistributed, so this repository does not contain it. `npm run setup` fetches
those components into your working copy from the libraries' own registries.
It is idempotent, and without it routes 01, 03 and 04 will not compile.

See [Licensing](#licensing--read-before-forking). The registries are already
configured in `components.json`, so the same command works for pulling in any
other component from those libraries.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run setup` | Fetch the non-redistributable registry components |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | Token mirror + colour guard + ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run shoot -- <route> <out.png> [ms] [--live] [--normal] [--reduced]` | Capture a frame |
| `npm run qa -- <route>` | Normal / reduced-motion / loop / `R` behaviour |
| `npm run fps -- <route> [passes]` | Frame timing on the real GPU |
| `npm run check:beams -- <frame.png>` | Route 06: verify every beam is live |

---

## How it works

### The stage

`components/DemoShell.tsx` is the frame every route renders into. It creates the
fixed surface, publishes `--stage-w`, `--stage-h` and `--safe` as CSS custom
properties from the constants in `lib/take/types.ts`, hosts the take state
machine, owns the single rAF loop and the single keyboard listener, and hides
the real cursor while a take is running.

There is an **80 px safe area** on all four sides. Nothing that matters should
cross it.

The stage is **never scaled** by default — an undersized viewport simply crops,
and a hint appears outside take mode. `?fit=1` opts into a uniform scale for
inspection on a smaller screen; the cursor divides by the same factor so its
visual position and its event coordinates can never disagree.

### Reduced motion

Under `prefers-reduced-motion: reduce`, every route renders its **final resting
state immediately** — no cursor, no entrance, no sequencing, shader motion
paused. The composition is still complete; it just doesn't move.

---

## Take mode

```text
/demos/01-cover                 inspect — static, real mouse works
/demos/01-cover?take=1          play the take once, then hold the final frame
/demos/01-cover?take=1&loop=1   play it repeatedly, resetting cleanly
R                               cancel and replay from the start, no reload
?fit=1                          scale the stage to fit a small viewport
```

The sequence:

1. The route renders. The composition is already complete enough to record —
   a clip never opens on an empty frame.
2. Fonts resolve, two frames paint, then the take waits exactly **800 ms**.
   Nothing important animates during this pre-roll.
3. `TAKE_START <epochMs>` is logged. The entrance and the cursor both begin.
4. Everything meaningful finishes within **4000 ms**.
5. `TAKE_END <epochMs>` is logged once, from the frame loop rather than a timer
   — a `setTimeout` drifts by hundreds of milliseconds under load.
6. The frame loop stops and the final state holds indefinitely, so there is no
   CPU cost while you finish recording.

Both markers are machine-parsable as `/^TAKE_(START|END) (\d+)$/`.

**Loop integrity.** Every timer for a run lives in a per-run bag disposed
wholesale on reset, and the rAF loop is created once for the provider's
lifetime. Repeated cycles produce matching start/end counts, no duplicated
frame loops and no leaked listeners — `npm run qa` asserts this.

---

## The synthetic cursor

This is the part that makes the rest work.

A route declares its choreography as data:

```ts
const cursorPath: CursorKeyframe[] = [
  { x: 236, y: 806, t: 0 },
  { x: 962, y: 606, t: 1220 },
  { x: 1288, y: 328, t: 1900 },
  { x: 1026, y: 628, t: 1200, action: "press" },
  { x: 1026, y: 628, t: 3100, action: "release" },
];
```

`x` / `y` are **stage coordinates** (0–1600 × 0–900). `t` is milliseconds from
`TAKE_START`. Actions are `click`, `press`, `release` and `hover-out`.
(`press` / `release` exist because a hold-to-confirm button needs real elapsed
time between mousedown and mouseup, which an atomic click cannot express.)

**Motion.** Positions are sampled from a centripetal Catmull-Rom spline through
the keyframes, with each segment's progress shaped by `easeInOutCubic`. A
straight polyline reads as robotic; a spline arcs. Position is written directly
to a transform via ref — no React state per frame, so no route ever re-renders
because the cursor moved.

**Events.** Each frame does three things, in order:

1. Dispatches `mousemove` on `document` at the converted client coordinates.
2. Hit-tests with `elementFromPoint` and, when the target changes, emits
   `mouseout` / `mouseover` with the correct `relatedTarget`. **React
   synthesises `onMouseEnter` / `onMouseLeave` from those**, which is what makes
   a 3D card's layers lift rather than merely tilt. A bare `mousemove` is not
   enough.
3. Dispatches directly to any element registered via `registerCursorTarget`.
   Background effect hosts sit behind foreground copy and would never win a hit
   test — React Bits' Threads binds `mousemove` on its own container, not on
   document, so without this it never reacts at all.

**Coordinates.** The stage is centred, so its origin is not `0,0`. The
conversion is `clientX = stageRect.left + stageX * scale`. The rect is cached
and re-read only on resize, never inside the frame loop.

---

## Capturing frames

```bash
npm run shoot -- 04-aceternity screenshots/04.png 2100
npm run shoot -- 06-magic screenshots/06.png 2500 --live
npm run shoot -- 01-cover screenshots/01.png 0 --normal --reduced
```

The harness opens the route at exactly 1600 × 900, waits for `TAKE_START`, then
**freezes the page at the requested offset** before capturing — screenshotting a
WebGL page costs hundreds of milliseconds, so sleeping and then capturing lands
on a much later frame than you asked for. It retries when a capture misses its
mark, and fails loudly rather than shipping a wrong frame.

`--live` skips the freeze for routes whose animations stop painting when
`requestAnimationFrame` is neutered (motion's SVG-gradient animations do). In
that mode the harness measures its own screenshot latency and leads the next
attempt by it.

---

## Customising it

### Brand colours

`lib/brand.ts` is the source of truth:

```ts
export const brand = {
  bg: "#0A0A0C",
  surface: "#121216",
  text: "#F5F7FA",
  muted: "#8A94A6",
  accent: "#2563FF",
  hairline: "rgba(255,255,255,0.12)",
} as const;
```

Change a value there, then change the matching `--color-*` in the `@theme`
block of `app/globals.css`. Tailwind v4's CSS cannot import TypeScript, so the
mirror is enforced rather than trusted: `npm run lint` fails if the two drift.

`globals.css` also remaps shadcn's semantic variables (`--background`,
`--primary`, `--border`, …) onto the tokens, so the base `button` / `card` /
`badge` primitives can never resolve to an off-brand colour.

Everything else derives from these six. `withAlpha(brand.accent, 0.3)` for
transparency, `hexToRgbUnit()` for shader uniforms, `color-mix(in srgb,
var(--color-accent) 20%, transparent)` in CSS.

### Typography

Swap the two faces in `app/layout.tsx` and their variable names in the `@theme`
block. The scale is defined once and used by name everywhere — no route
contains an arbitrary font size, and the colour guard rejects `text-[…]`
values.

| Token | Size / line-height | Tracking | Weight |
| --- | --- | --- | --- |
| `text-display-xl` | 132 / 0.92 | −0.03em | 500 |
| `text-display-l` | 88 / 0.98 | −0.025em | 500 |
| `text-heading` | 46 / 1.10 | −0.02em | 500 |
| `text-body` | 22 / 1.50 | −0.01em | 400 |
| `text-ui` | 16 / 1.35 | 0 | 500 |
| `text-caption` | 14 / 1.30 | 0.02em | 400 (mono) |

### Stage size

`STAGE_W`, `STAGE_H` and `SAFE` in `lib/take/types.ts`. Everything reads from
there — the shell, the corner marks, the cursor maths and the capture harness.
Change them for a square or vertical format and the whole system follows.

You will need to reposition each route's content and cursor path, since those
are authored in stage coordinates.

### Take timing

`lib/take/take-context.tsx`:

```ts
export const TAKE_DURATION = 4000;  // hard ceiling after TAKE_START
export const PREROLL_MS    = 800;   // readiness pause before playback
export const LOOP_HOLD_MS  = 900;   // hold on the final frame before looping
export const LOOP_GAP_MS   = 500;   // gap between reset and the next start
```

### Shared primitives

`components/demos/ui/` is the vocabulary the routes are built from:

| Component | What it is |
| --- | --- |
| `Surface` | Panel treatment — hairline border, key-light catch on the top edge, interior falloff, optional accent bloom beneath |
| `Sparkline` | Small line chart from a real series. Catmull-Rom smoothing, area fill, marked last value, optional draw-on via `stroke-dashoffset` |
| `GridField` | Hairline measuring grid, optionally masked so it dissolves at the edges. Gives glass and displacement effects something to bend |
| `Grain` | Achromatic film grain, rasterised once and tiled. Breaks up flat dark fields and survives H.264, which bands smooth gradients |
| `CornerMarks` | Crop marks on the safe area, so the frame reads as an artboard |
| `StatusDot` | Accent dot with a slow expanding halo, for live state |
| `Rule` | Hairline rule that draws on by scaling along one axis |
| `Reveal` | Transform + opacity entrance driven by a single state flip and a CSS delay |
| `DelayedMount` | Mounts children at an offset from `TAKE_START`, measured on the take's own frame clock |

---

## Adding a route

1. **Create the page** at `app/demos/08-yours/page.tsx`. Keep it thin:

   ```tsx
   import { DemoShell } from "@/components/DemoShell";
   import { YourDemo } from "@/components/demos/YourDemo";
   import { parseTakeParams, type DemoSearchParams } from "@/lib/take/params";

   export default async function Page({
     searchParams,
   }: { searchParams: Promise<DemoSearchParams> }) {
     const { takeMode, loopMode, fit } = parseTakeParams(await searchParams);
     return (
       <DemoShell takeMode={takeMode} loopMode={loopMode} fit={fit}>
         <YourDemo />
       </DemoShell>
     );
   }
   ```

2. **Write the composition** in `components/demos/YourDemo.tsx`. Read
   `useTake()` for `started` / `ready` / `reduced`, use `Reveal` for entrances,
   and declare a `cursorPath`. Consume take state in **leaf** components where
   you can — anything that reads the context re-renders at `TAKE_START`, which
   you do not want happening around a shader.

3. **Register it** in `DEMO_ROUTES` in `lib/take/params.ts` so it appears on the
   index and gets a keyboard shortcut.

4. **Tune the cursor against real screenshots**, not arithmetic. Capture at a
   few offsets, look at where the cursor actually is, adjust. Measuring the
   element you are aiming at is the fastest way in:

   ```bash
   node scripts/inspect.mjs 08-yours \
     "(()=>{const r=document.querySelector('button').getBoundingClientRect();
       return [r.left+r.width/2, r.top+r.height/2];})()"
   ```

5. **Verify** with `npm run qa -- 08-yours` and `npm run fps -- 08-yours`.

### Using a different component library

The libraries here are just examples. `components.json` already registers five
registries, so:

```bash
npx shadcn@latest add @magicui/<component>
```

Then **wrap, don't edit**. Every customisation in this project lives in a
wrapper, in exposed props, or in a scoped rule in `globals.css` — never in the
copied source. That is what makes upgrading a component a non-event.

---

## Reference routes

| Key | Route | Library | Components | Money frame |
| --- | --- | --- | --- | ---: |
| `1` | `/demos/01-cover` | React Bits | Threads, BlurText | 3.6 s |
| `2` | `/demos/03-reactbits` | React Bits | Threads, BlurText | 3.6 s |
| `3` | `/demos/04-aceternity` | Aceternity UI | 3D Card, Spotlight | 2.1 s |
| `4` | `/demos/05-cult` | Cult UI | Hero Liquid Metal | 2.0 s |
| `5` | `/demos/06-magic` | Magic UI | Animated Beam | 2.5 s |
| `6` | `/demos/07-kokonut` | Kokonut UI | Liquid Glass Card, Hold Button | 2.9 s |

Route numbering is intentionally non-contiguous — the filesystem names are
stable so recorded clips keep matching their source.

Routes 01, 03 and 05 finish their entrance early and hold; they are cut back to
frame one deliberately rather than looped seamlessly. Routes 04, 06 and 07
return the cursor near its start so a loop reset is quiet.

Notes worth knowing if you touch them:

- **Route 04** proves the event synthesis works — `translateZ(80px)` on the
  headline only happens if `isMouseEntered` flipped, which needs
  `mouseover`/`mouseout`, not just `mousemove`. Peak tilt is `rotateY 12.9°`
  at 2.1 s; the extreme keyframe sits at 1.9 s because the card carries a
  200 ms transition.
- **Route 05** feeds its own wordmark to the shader. `LiquidMetal` takes the
  shape it deforms as an `image`, so a canvas renders `NLOGN` in the brand face
  and hands over the `HTMLImageElement`. Swap the string to rebrand it.
- **Route 06** keeps its diagram in `lib/demos/magic-topology.json`, read by
  both the route and `check-beams.mjs`, so the verifier can never check a stale
  copy.

---

## Project layout

```text
app/
  page.tsx                  redirects to /demos
  demos/
    page.tsx                index with keyboard shortcuts
    01-cover/page.tsx       thin route wrappers
    …
  globals.css               tokens, type scale, shadcn var remap, keyframes

components/
  DemoShell.tsx             stage, letterbox, scroll lock, take host, rAF owner
  DemoCursor.tsx            fake cursor + synthetic event dispatch
  demos/
    CoverDemo.tsx           one file per route composition
    …
    ui/                     shared primitives
  ui/, kokonutui/           vendored library source — never edited

lib/
  brand.ts                  the six tokens + colour helpers
  demos/                    route data shared with tooling
  take/
    take-context.tsx        take state machine
    syntheticPointer.ts     event synthesis + target registry
    spline.ts               Catmull-Rom sampling
    stage.ts                stage <-> client coordinate conversion
    types.ts                stage constants, CursorKeyframe

scripts/
  setup-components.mjs      fetch non-redistributable components
  shoot.mjs                 frame-exact capture
  qa.mjs                    behavioural QA
  fps.mjs                   frame timing
  check-beams.mjs           route 06 beam verification
  check-tokens.mjs          brand.ts <-> globals.css mirror
  check-colors.mjs          off-brand colour guard
```

---

## Guardrails

Two checks run as part of `npm run lint`:

**`check-tokens.mjs`** fails if `lib/brand.ts` and the `@theme` block disagree.

**`check-colors.mjs`** fails on any raw hex, `rgb()`, `hsl()` or Tailwind
palette class (`bg-blue-500` and friends) in code you wrote, and on arbitrary
font sizes. Vendored library source is exempt — it is neutralised at the call
site instead.

ESLint ignores the vendored directories for the same reason: those files carry
their authors' conventions, and linting them would only create pressure to edit
source that should stay pristine.

---

## Performance

Measured in a headed browser on the real GPU, sampling steady state
(`npm run fps -- <route>`). All six routes: **median frame 17 ms**.

The lessons that shaped it:

- **The cursor pipeline is free.** Isolation testing showed that stubbing
  `elementFromPoint` or `dispatchEvent` changed nothing, while hiding a WebGL
  canvas restored 60 fps. Per-frame event dispatch is not your bottleneck;
  shaders are.
- **Render shaders small and upscale them.** React Bits' Threads went from
  ~790k pixels a frame to ~115k — a 7× cut — by rendering at a fraction of
  display size. Because its line width is a constant measured against the
  render size, rendering smaller also *thickens* the lines, so the cheap
  direction and the compression-safe direction are the same one.
- **Use a component's own budget knobs first.** Cult UI's shader is capped via
  `maxPixelCount` and `minPixelRatio` — resolution before motion quality.
- **Watch for transform collisions.** A `Reveal` animating `transform` on the
  same element as a positioning `-translate-x-1/2` silently dropped the
  centring *and* caused a 1051 ms main-thread stall by invalidating a large
  layer over a canvas. Positioning transforms belong on a wrapper.
- **CSS `filter: blur()` on a live-animating SVG is expensive.** A 7 px blur on
  four beams halved the frame rate; 5 px on a narrower stroke looked the same
  and cost nothing.

---

## Licensing — read before forking

The code in this repository is MIT (see `LICENSE`). **The component libraries it
consumes are not all under the same terms**, and that difference determines what
your fork is allowed to contain.

- **React Bits** is MIT + Commons Clause — you may use the components, but not
  *"sell, sublicense, or redistribute the components themselves — whether alone,
  in a bundle, or as a ported version."*
- **Aceternity UI**'s licence prohibits re-distributing *"the Item or its source
  files"* and creating templates from it.

Both are therefore **git-ignored** and fetched by `npm run setup`. If you fork
this project, leave those `.gitignore` entries alone — committing those files is
the thing the licences forbid.

Cult UI, Magic UI, Kokonut UI and the shadcn primitives are plain MIT and are
included here with their notices.

Full detail in [`THIRD-PARTY-NOTICES.md`](./THIRD-PARTY-NOTICES.md). It records
what the upstream licences say; if you plan to sell something built on this,
read them yourself.
