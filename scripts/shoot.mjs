/**
 * Frame-exact capture harness.
 *
 * Screenshotting a WebGL page costs hundreds of ms, so simply sleeping for the
 * offset and then calling screenshot() captures a much later frame than asked
 * for. Instead the page freezes itself at the exact deadline — every animation
 * here is rAF-driven, so neutering requestAnimationFrame stops the cursor, the
 * shaders and motion's frameloop on the same tick — and the capture then
 * happens at leisure against a stationary frame.
 *
 * Usage: node scripts/shoot.mjs <route> <out.png> [msAfterTakeStart] [--normal]
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const [route, out, offsetArg, ...flags] = process.argv.slice(2);
if (!route || !out) {
  console.error("usage: node scripts/shoot.mjs <route> <out.png> [ms] [--normal]");
  process.exit(1);
}
const offset = Number(offsetArg ?? 2000);
const normal = flags.includes("--normal");
// Motion's SVG-attribute animations (Magic UI's beam gradients) stop painting
// when requestAnimationFrame is neutered, so those routes are captured live.
// Everything else freezes for frame-exact offsets.
const live = flags.includes("--live");
const port = process.env.PORT ?? "3000";

/**
 * Frames can be sparse while a shader boots, which makes the freeze deadline
 * land late. A capture that misses its mark is retried rather than silently
 * shipped, since these offsets are the whole point of the money frames.
 */
const TOLERANCE_MS = 260;
const MAX_ATTEMPTS = 4;

// A live capture keeps running while the screenshot is taken, and that
// latency is hundreds of ms on a busy machine. Rather than hand-tuning every
// offset, the harness measures its own overshoot and leads the next attempt by
// it.
let attempt = 0;
let lead = 0;
let result = null;
while (attempt < MAX_ATTEMPTS) {
  attempt += 1;
  result = await capture(lead);
  if (normal || Math.abs(result.actual - offset) <= TOLERANCE_MS) break;
  if (live) lead += result.actual - offset;
  console.warn(
    `  retry ${attempt}/${MAX_ATTEMPTS}: landed at ${result.actual}ms, wanted ${offset}ms` +
      (live ? ` (leading next attempt by ${Math.round(lead)}ms)` : ""),
  );
}

console.log(
  `${out}  requested=${normal ? "normal" : offset + "ms"} actual=${result.actual ?? "-"}ms ` +
    `attempts=${attempt} scroll=${result.scroll.sw}x${result.scroll.sh} viewport=${result.scroll.iw}x${result.scroll.ih} logs=[${result.takeLines.join(", ")}]`,
);
if (result.scroll.sw > result.scroll.iw || result.scroll.sh > result.scroll.ih) {
  console.error("SCROLL OVERFLOW DETECTED");
  process.exitCode = 1;
}
if (!normal && Math.abs(result.actual - offset) > TOLERANCE_MS) {
  console.error(`MISSED OFFSET after ${MAX_ATTEMPTS} attempts`);
  process.exitCode = 1;
}
if (result.errors.length) {
  console.error("PAGE ERRORS:\n  " + result.errors.join("\n  "));
  process.exitCode = 1;
}

async function capture(lead = 0) {
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1600, height: 900 },
  deviceScaleFactor: 1,
  reducedMotion: flags.includes("--reduced") ? "reduce" : "no-preference",
});

// Everything below is scheduled inside the page, before any app script runs.
// Driving the freeze from Node instead would cost two round trips against a
// main thread busy booting React and WebGL, which overshot the target frame by
// close to a second.
await page.addInitScript(
  ({ offset, normal }) => {
    const original = console.log;
    console.log = (...args) => {
      if (String(args[0]).startsWith("TAKE_START")) {
        window.__takeStartPerf = performance.now();
        if (normal) return original.apply(console, args);
        const deadline = window.__takeStartPerf + offset;
        // Polled on a timer rather than rAF: on a shader-heavy route rAF can
        // starve for most of a second, which would drift the freeze — and the
        // whole point of freezing is to land on an exact offset.
        const timer = setInterval(() => {
          if (performance.now() < deadline) return;
          clearInterval(timer);
          window.__frozenAt = Math.round(
            performance.now() - window.__takeStartPerf,
          );
          window.requestAnimationFrame = () => 0;
        }, 4);
      }
      return original.apply(console, args);
    };
  },
  { offset: offset - lead, normal: normal || live },
);

const errors = [];
const takeLines = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  const t = m.text();
  if (m.type() === "error") errors.push(`console.error: ${t}`);
  if (t.startsWith("TAKE_")) takeLines.push(t);
});
page.on("requestfailed", (r) =>
  errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText ?? ""}`),
);

const url = `http://localhost:${port}/demos/${route}${normal ? "" : "?take=1"}`;

// Warm the route: a cold dev compile would otherwise land inside the window.
await fetch(url).catch(() => {});

// "commit" resolves as soon as the response arrives, so we are already waiting
// when TAKE_START fires ~800ms later.
await page.goto(url, { waitUntil: "commit" });

let actual = null;
if (normal) {
  await page.waitForLoadState("load");
  await page.waitForTimeout(1800);
} else {
  if (live) {
    await page.waitForFunction(
      (target) => performance.now() - window.__takeStartPerf >= target,
      offset - lead,
      { timeout: 25000 },
    );
  } else {
    await page.waitForFunction(() => window.__frozenAt !== undefined, null, {
      timeout: 25000,
    });
  }
  // Frozen captures report the instant the page actually froze; live ones
  // measure now. Reporting `now` for a frozen capture would just be measuring
  // this script's own round-trip latency.
  actual = live
    ? await page.evaluate(() =>
        Math.round(performance.now() - window.__takeStartPerf),
      )
    : await page.evaluate(() => window.__frozenAt);
}

mkdirSync(dirname(out), { recursive: true });
await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1600, height: 900 } });

// A live capture keeps running while the screenshot is taken, so the frame on
// disk is no earlier than this. Reporting the pre-screenshot time would
// understate the offset by the capture latency.
if (live) {
  actual = await page.evaluate(() =>
    Math.round(performance.now() - window.__takeStartPerf),
  );
}

const scroll = await page.evaluate(() => ({
  sw: document.documentElement.scrollWidth,
  sh: document.documentElement.scrollHeight,
  iw: window.innerWidth,
  ih: window.innerHeight,
}));

await browser.close();

  return { actual, scroll, errors, takeLines };
}
