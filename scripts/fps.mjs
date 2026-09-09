/**
 * Measures on-page rAF frame timing across a take, in a headed browser so the
 * real GPU is used. Runs several passes because a single pass on a loaded
 * machine is noisy.
 */
import { chromium } from "playwright";
const route = process.argv[2];
const passes = Number(process.argv[3] ?? 3);
const port = process.env.PORT ?? "3000";
const url = `http://localhost:${port}/demos/${route}?take=1`;

const b = await chromium.launch({ headless: false });
const results = [];
for (let i = 0; i < passes; i++) {
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  await p.addInitScript(() => {
    const raf = requestAnimationFrame.bind(window);
    window.__f = [];
    const r = (t) => { window.__f.push(t); raf(r); };
    raf(r);
  });
  await p.goto(url, { waitUntil: "commit" });
  await p.waitForTimeout(6000);
  results.push(await p.evaluate(() => {
    const f = window.__f.filter((t) => t > window.__f[0] + 1500); // skip boot
    const g = [];
    for (let i = 1; i < f.length; i++) g.push(f[i] - f[i - 1]);
    g.sort((a, b) => a - b);
    return {
      fps: Math.round(1000 / g[g.length >> 1]),
      median: Math.round(g[g.length >> 1]),
      p95: Math.round(g[Math.floor(g.length * 0.95)]),
    };
  }));
  await p.close();
}
const best = results.reduce((a, r) => (r.fps > a.fps ? r : a));
console.log(route, "passes:", JSON.stringify(results), "-> best:", JSON.stringify(best));
await b.close();
