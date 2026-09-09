/**
 * Guards the "six tokens only" rule across project-authored code.
 *
 * components/ui, components/kokonutui, components/Threads.tsx and
 * components/BlurText.tsx are copied library source and are intentionally
 * exempt — they are kept pristine and neutralised at the call site via
 * className / props / scoped CSS instead.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["app", "components", "lib"];
const EXEMPT = [
  "components/ui/",
  "components/kokonutui/",
  "components/Threads.tsx",
  "components/BlurText.tsx",
];

const PALETTE =
  "red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone";

const RULES = [
  {
    name: "Tailwind palette colour",
    re: new RegExp(
      `\\b(?:bg|text|border|from|via|to|fill|stroke|shadow|ring|decoration|outline|accent|caret|divide)-(?:${PALETTE})-\\d{2,3}\\b`,
      "g",
    ),
  },
  // Not preceded by "&", so HTML numeric entities are not mistaken for hex.
  { name: "raw hex colour", re: /(?<!&)#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g },
  { name: "raw rgb()/rgba() colour", re: /\brgba?\(/g },
  { name: "raw hsl()/hsla() colour", re: /\bhsla?\(/g },
  {
    name: "arbitrary font-size utility",
    re: /\btext-\[\s*\d/g,
  },
];

// lib/brand.ts is where the six values are allowed to be spelled out.
const ALLOW_FILE = new Set(["lib/brand.ts"]);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|css)$/.test(p)) out.push(p);
  }
  return out;
}

const problems = [];
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const rel = file.replaceAll("\\", "/");
    if (EXEMPT.some((e) => rel.startsWith(e)) || ALLOW_FILE.has(rel)) continue;
    // globals.css is the token mirror; check-tokens.mjs validates it instead.
    if (rel === "app/globals.css") continue;
    const src = readFileSync(file, "utf8");
    src.split("\n").forEach((line, i) => {
      if (line.includes("check-colors-ignore")) return;
      for (const rule of RULES) {
        rule.re.lastIndex = 0;
        const m = rule.re.exec(line);
        if (m) problems.push(`${rel}:${i + 1}  ${rule.name}: ${m[0]}`);
      }
    });
  }
}

if (problems.length) {
  console.error(
    `Off-brand colour usage (${problems.length}):\n  ` + problems.join("\n  "),
  );
  process.exit(1);
}
console.log("Colours OK — every value resolves to the six brand tokens.");
