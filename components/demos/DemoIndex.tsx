"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DEMO_ROUTES } from "@/lib/take/params";

/** Development navigation only — not part of the recorded visuals. */
export function DemoIndex() {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        el?.isContentEditable ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      ) {
        return;
      }
      const match = DEMO_ROUTES.find((r) => r.key === e.key);
      if (match) {
        e.preventDefault();
        router.push(match.href);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <main className="h-full overflow-auto px-20 py-20">
      <header className="mb-16">
        <p className="font-mono text-caption text-muted">NLOGN</p>
        <h1 className="mt-3 text-heading text-text">Demo lab</h1>
        <p className="mt-3 max-w-xl text-body text-muted">
          Six recording stages, each authored at 1600&times;900. Press a number
          key to jump, or append{" "}
          <code className="font-mono text-caption text-text">?take=1</code> to
          play the choreographed take.
        </p>
      </header>

      <ul className="max-w-3xl">
        {DEMO_ROUTES.map((route, i) => (
          <li key={route.href} className="border-t border-hairline last:border-b">
            <Link
              href={route.href}
              className="group flex items-baseline gap-6 py-5 transition-opacity hover:opacity-100 md:gap-10"
            >
              <span className="w-6 font-mono text-caption text-muted">
                {i + 1}
              </span>
              <span className="flex-1 text-heading text-text">{route.label}</span>
              <span className="font-mono text-caption text-muted">
                /demos/{route.n}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-14 font-mono text-caption text-muted">
        ?take=1 plays a single take. ?take=1&amp;loop=1 repeats it. R replays.
      </p>
    </main>
  );
}
