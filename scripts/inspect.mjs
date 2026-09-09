/** Ad-hoc DOM/computed-style probe against a running route. */
import { chromium } from "playwright";
const [route, expr] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
await p.goto(`http://localhost:${process.env.PORT ?? 3000}/demos/${route}`, { waitUntil: "networkidle" });
console.log(JSON.stringify(await p.evaluate(expr), null, 1));
await b.close();
