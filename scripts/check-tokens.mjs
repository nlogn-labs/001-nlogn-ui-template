/**
 * Fails if app/globals.css drifts from lib/brand.ts.
 * Tailwind v4 cannot import TypeScript, so the mirror is enforced here
 * instead of trusted to discipline.
 */
import { readFileSync } from "node:fs";

const ts = readFileSync("lib/brand.ts", "utf8");
const css = readFileSync("app/globals.css", "utf8");

const tokens = {};
const block = ts.slice(ts.indexOf("export const brand"), ts.indexOf("} as const"));
for (const [, k, v] of block.matchAll(/(\w+):\s*"([^"]+)"/g)) tokens[k] = v;

const expected = ["bg", "surface", "text", "muted", "accent", "hairline"];
const problems = [];

for (const key of expected) {
  if (!tokens[key]) {
    problems.push(`lib/brand.ts is missing token "${key}"`);
    continue;
  }
  const re = new RegExp(`--color-${key}:\\s*([^;]+);`);
  const found = css.match(re);
  if (!found) {
    problems.push(`app/globals.css @theme is missing --color-${key}`);
  } else if (found[1].trim() !== tokens[key]) {
    problems.push(
      `--color-${key} is "${found[1].trim()}" in globals.css but "${tokens[key]}" in brand.ts`,
    );
  }
}

if (problems.length) {
  console.error("Token drift detected:\n  " + problems.join("\n  "));
  process.exit(1);
}
console.log(`Tokens OK — ${expected.length} brand values in sync.`);
