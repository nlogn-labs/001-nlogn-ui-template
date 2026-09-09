/** Shared search-param parsing for every demo route. */
export type DemoSearchParams = Record<string, string | string[] | undefined>;

const on = (v: string | string[] | undefined) =>
  v === "1" || v === "true" || (Array.isArray(v) && v.includes("1"));

export function parseTakeParams(sp: DemoSearchParams) {
  const takeMode = on(sp.take);
  return {
    takeMode,
    loopMode: takeMode && on(sp.loop),
    fit: on(sp.fit),
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
