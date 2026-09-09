/**
 * Samples each beam's quadratic in stage coordinates and reports the strongest
 * accent pixel found on it — the only reliable way to confirm every comet is
 * actually painting at the money frame.
 */
import { PNG } from "pngjs";
import { readFileSync } from "node:fs";

// Read from the same file the route renders from, so this can never verify a
// stale copy of the diagram.
const topology = JSON.parse(
  readFileSync(new URL("../lib/demos/magic-topology.json", import.meta.url), "utf8"),
);
const NODES = Object.fromEntries(
  Object.entries(topology.nodes).map(([k, v]) => [k, [v.x, v.y]]),
);
const BEAMS = topology.beams.map((b) => [b.from, b.to, b.curvature]);

const png = PNG.sync.read(readFileSync(process.argv[2]));
const at = (x, y) => {
  const i = (png.width * Math.round(y) + Math.round(x)) << 2;
  return [png.data[i], png.data[i + 1], png.data[i + 2]];
};

let failures = 0;
for (const [a, b, curv] of BEAMS) {
  const [ax, ay] = NODES[a];
  const [bx, by] = NODES[b];
  const cx = (ax + bx) / 2;
  const cy = ay - curv;
  let peak = 0;
  let where = null;
  let peakT = 0;
  // Skip the ends: a lit tile's own accent border sits on the path there and
  // would be mistaken for a comet.
  for (let i = 36; i <= 276; i++) {
    const t = i / 300;
    const x = (1 - t) ** 2 * ax + 2 * t * (1 - t) * cx + t ** 2 * bx;
    const y = (1 - t) ** 2 * ay + 2 * t * (1 - t) * cy + t ** 2 * by;
    for (let dx = -4; dx <= 4; dx++) {
      for (let dy = -4; dy <= 4; dy++) {
        const [r, , bl] = at(x + dx, y + dy);
        if (bl - r > peak) {
          peak = bl - r;
          where = [Math.round(x), Math.round(y)];
          peakT = t;
        }
      }
    }
  }
  const ok = peak > 120;
  if (!ok) failures += 1;
  console.log(
    `${(a + " -> " + b).padEnd(22)} accent ${String(peak).padStart(3)} at t=${peakT.toFixed(2)} ${where}  ${ok ? "LIVE" : "DARK"}`,
  );
}
process.exitCode = failures ? 1 : 0;
