/** Shared search-param parsing for every demo route. */
export type DemoSearchParams = Record<string, string | string[] | undefined>;

const on = (v: string | string[] | undefined) =>
  v === "1" || v === "true" || (Array.isArray(v) && v.includes("1"));

const off = (v: string | string[] | undefined) =>
  v === "0" || v === "false" || (Array.isArray(v) && v.includes("0"));

export function parseTakeParams(sp: DemoSearchParams) {
  const takeMode = on(sp.take);
  return {
    takeMode,
    loopMode: takeMode && on(sp.loop),
    // Tri-state. Absent: scale to fit while browsing, so the whole 1600x900
    // composition is visible and centred on any panel — but stay 1:1 in take
    // mode, where the recording must be the authored pixels. `?fit=1` forces
    // scaling on, `?fit=0` forces it off (raw 1:1, cropped).
    fit: off(sp.fit) ? false : on(sp.fit) ? true : !takeMode,
  };
}

export const DEMO_ROUTES = [
  { key: "1", n: "01", href: "/demos/01-cover", label: "Cover" },
  { key: "2", n: "03", href: "/demos/03-reactbits", label: "React Bits Portfolio" },
  { key: "3", n: "04", href: "/demos/04-aceternity", label: "Aceternity" },
  { key: "4", n: "05", href: "/demos/05-cult", label: "Cult" },
  { key: "5", n: "06", href: "/demos/06-magic", label: "Magic" },
  { key: "6", n: "07", href: "/demos/07-kokonut", label: "Kokonut" },
] as const;
