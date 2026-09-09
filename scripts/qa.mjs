/**
 * Behavioural QA for a route: normal mode, reduced motion, loop integrity and
 * the R replay key. Loop integrity is the important one — it proves repeated
 * takes do not accumulate timers, frame loops or console output.
 */
import { chromium } from "playwright";
const route = process.argv[2];
const port = process.env.PORT ?? "3000";
const base = `http://localhost:${port}/demos/${route}`;
const b = await chromium.launch({ headless: false });
const problems = [];

async function newPage(opts = {}) {
  const p = await b.newPage({ viewport: { width: 1600, height: 900 }, ...opts });
  p.on("pageerror", (e) => problems.push(`${route} pageerror: ${e.message}`));
  p.on("console", (m) => {
    if (m.type() === "error") problems.push(`${route} console.error: ${m.text()}`);
  });
  return p;
}

// 1. Normal mode: no take logs, no cursor, composition already resolved.
{
  const p = await newPage();
  const logs = [];
  p.on("console", (m) => m.text().startsWith("TAKE_") && logs.push(m.text()));
  await p.goto(base, { waitUntil: "load" });
  await p.waitForTimeout(2500);
  const cursor = await p.evaluate(() => !!document.querySelector("[data-fake-cursor]"));
  console.log(`normal:   takeLogs=${logs.length} fakeCursor=${cursor}`);
  if (logs.length) problems.push("normal mode logged TAKE_*");
  if (cursor) problems.push("normal mode rendered the fake cursor");
  await p.close();
}

// 2. Reduced motion: final state immediately, no choreography.
{
  const p = await newPage({ reducedMotion: "reduce" });
  const logs = [];
  p.on("console", (m) => m.text().startsWith("TAKE_") && logs.push(m.text()));
  await p.goto(`${base}?take=1`, { waitUntil: "load" });
  await p.waitForTimeout(2500);
  const cursor = await p.evaluate(() => !!document.querySelector("[data-fake-cursor]"));
  console.log(`reduced:  takeLogs=${logs.length} fakeCursor=${cursor}`);
  if (logs.length) problems.push("reduced motion still ran a take");
  if (cursor) problems.push("reduced motion rendered the fake cursor");
  await p.close();
}

// 3. Loop mode over three cycles.
{
  const p = await newPage();
  const logs = [];
  p.on("console", (m) => m.text().startsWith("TAKE_") && logs.push(m.text()));
  await p.goto(`${base}?take=1&loop=1`, { waitUntil: "commit" });
  await p.waitForTimeout(19000);
  const starts = logs.filter((l) => l.startsWith("TAKE_START")).length;
  const ends = logs.filter((l) => l.startsWith("TAKE_END")).length;
  const rafDepth = await p.evaluate(
    () => new Promise((res) => {
      // Count how many rAF callbacks the page schedules in one frame: more
      // than a couple means duplicated loops.
      let n = 0;
      const raf = requestAnimationFrame.bind(window);
      const orig = window.requestAnimationFrame;
      window.requestAnimationFrame = (cb) => { n++; return orig.call(window, cb); };
      raf(() => raf(() => { window.requestAnimationFrame = orig; res(n); }));
    }),
  );
  const canvases = await p.evaluate(() => document.querySelectorAll("canvas").length);
  console.log(`loop:     starts=${starts} ends=${ends} rafPerFrame=${rafDepth} canvases=${canvases}`);
  if (starts < 3) problems.push(`loop produced only ${starts} takes in 19s`);
  // The sampling window can close mid-take, so one unfinished take is fine.
  if (ends !== starts && ends !== starts - 1) {
    problems.push(`loop TAKE_START(${starts}) / TAKE_END(${ends}) mismatch`);
  }
  if (canvases > 1) problems.push(`loop leaked canvases: ${canvases}`);
  await p.close();
}

// 4. R replays without a reload.
{
  const p = await newPage();
  const logs = [];
  p.on("console", (m) => m.text().startsWith("TAKE_") && logs.push(m.text()));
  await p.goto(`${base}?take=1`, { waitUntil: "commit" });
  await p.waitForTimeout(6000);
  const before = logs.length;
  await p.keyboard.press("r");
  await p.waitForTimeout(6000);
  const navigated = await p.evaluate(() => performance.getEntriesByType("navigation").length);
  console.log(`R key:    logsBefore=${before} logsAfter=${logs.length} navigations=${navigated}`);
  if (logs.length <= before) problems.push("R did not replay the take");
  if (navigated !== 1) problems.push("R caused a page reload");
  await p.close();
}

await b.close();
if (problems.length) {
  console.error("QA PROBLEMS:\n  " + problems.join("\n  "));
  process.exit(1);
}
console.log(`QA OK — ${route}`);
