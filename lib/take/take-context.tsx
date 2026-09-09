"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

/** Hard ceiling: every take completes within this window after TAKE_START. */
export const TAKE_DURATION = 4000;
/** Mandatory readiness pre-roll before playback begins. */
export const PREROLL_MS = 800;
/** Quiet hold on the final frame before a looped take resets. */
export const LOOP_HOLD_MS = 900;
/** Gap between reset and the next TAKE_START in loop mode. */
export const LOOP_GAP_MS = 500;

export type TakePhase = "preroll" | "playing" | "held" | "static";

export type FrameCallback = (elapsed: number) => void;

type TakeValue = {
  /** True when ?take=1 is present. */
  takeMode: boolean;
  /** True when ?take=1&loop=1 is present. */
  loopMode: boolean;
  /** prefers-reduced-motion: reduce */
  reduced: boolean;
  phase: TakePhase;
  /** Increments on every replay. Key stateful subtrees with this. */
  runId: number;
  /** True once the entrance may run. Immediate outside take mode. */
  started: boolean;
  /**
   * False until the client has resolved prefers-reduced-motion. Routes must
   * not mount entrance components before this flips, or a component that
   * self-triggers on mount (React Bits' BlurText observes itself into view)
   * would animate and then be torn down when the media query resolves.
   */
  ready: boolean;
  /** Subscribe to the single shared rAF loop. Returns an unsubscribe fn. */
  subscribeFrame: (cb: FrameCallback) => () => void;
  /** Cancel and replay from the beginning. */
  replay: () => void;
};

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};
const getReducedMotion = () => window.matchMedia(REDUCED_QUERY).matches;
const subscribeNever = () => () => {};

const TakeContext = createContext<TakeValue | null>(null);

export function useTake(): TakeValue {
  const ctx = useContext(TakeContext);
  if (!ctx) throw new Error("useTake must be used inside <TakeProvider>");
  return ctx;
}

/**
 * Take-mode state machine.
 *
 * Every timer for a given run is registered in a per-run bag that is disposed
 * wholesale on reset, and the rAF loop is created once for the provider's
 * lifetime rather than per run. Loop mode therefore cannot accumulate timers,
 * duplicate frame loops, drift, or repeat its TAKE_START logging.
 */
export function TakeProvider({
  takeMode,
  loopMode,
  children,
}: {
  takeMode: boolean;
  loopMode: boolean;
  children: React.ReactNode;
}) {
  // Read as external stores rather than state-set-from-an-effect: both are
  // browser facts, not React state, and this way `reduced` is already correct
  // on the first post-hydration render instead of flipping a frame later.
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    () => false,
  );
  const ready = useSyncExternalStore(subscribeNever, () => true, () => false);
  const [phase, setPhase] = useState<TakePhase>(takeMode ? "preroll" : "static");
  const [runId, setRunId] = useState(0);
  const [started, setStarted] = useState(!takeMode);

  const timers = useRef<number[]>([]);
  const subscribers = useRef(new Set<FrameCallback>());
  const rafId = useRef<number | null>(null);
  const takeStart = useRef<number>(0);
  const running = useRef(false);
  const endLogged = useRef(false);

  const clearTimers = useCallback(() => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const stopLoop = useCallback(() => {
    running.current = false;
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  }, []);

  const subscribeFrame = useCallback((cb: FrameCallback) => {
    subscribers.current.add(cb);
    return () => {
      subscribers.current.delete(cb);
    };
  }, []);

  const beginPlayback = useCallback(() => {
    endLogged.current = false;
    takeStart.current = performance.now();
    console.log(`TAKE_START ${Date.now()}`);
    setPhase("playing");
    setStarted(true);

    running.current = true;
    const tick = () => {
      if (!running.current) return;
      const elapsed = performance.now() - takeStart.current;
      if (elapsed >= TAKE_DURATION) {
        // Settle on the exact final frame, then stop burning frames.
        for (const cb of subscribers.current) cb(TAKE_DURATION);
        stopLoop();
        // Logged from the frame loop rather than a setTimeout: a timer drifts
        // by hundreds of ms under shader load, which would make TAKE_END an
        // unreliable marker for anything parsing the console.
        if (!endLogged.current) {
          endLogged.current = true;
          console.log(`TAKE_END ${Date.now()}`);
        }
        setPhase("held");
        return;
      }
      for (const cb of subscribers.current) cb(elapsed);
      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
  }, [stopLoop]);

  const startRun = useCallback(
    (delay: number) => {
      setPhase("preroll");
      setStarted(false);
      later(beginPlayback, delay);
    },
    [beginPlayback, later],
  );

  const replay = useCallback(() => {
    clearTimers();
    stopLoop();
    setRunId((n) => n + 1);
    startRun(LOOP_GAP_MS);
  }, [clearTimers, startRun, stopLoop]);

  // Initial run: wait for real readiness, then the mandatory 800ms pre-roll.
  useEffect(() => {
    if (!takeMode || reduced) return;
    let cancelled = false;
    const ready = () => {
      if (cancelled) return;
      // Two frames after fonts settle: first paint has definitely landed, so
      // the pre-roll measures from a genuinely complete composition.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (!cancelled) startRun(PREROLL_MS);
        }),
      );
    };
    const fonts = document.fonts;
    if (!fonts || fonts.status === "loaded") {
      ready();
    } else {
      fonts.ready.then(ready, ready);
    }
    return () => {
      cancelled = true;
      clearTimers();
      stopLoop();
    };
    // Intentionally keyed only on mode: replays are driven through replay().
  }, [takeMode, reduced, startRun, clearTimers, stopLoop]);

  // Loop mode: hold the final frame, then reset cleanly and run again.
  useEffect(() => {
    if (!loopMode || phase !== "held" || reduced) return;
    later(() => {
      setRunId((n) => n + 1);
      startRun(LOOP_GAP_MS);
    }, LOOP_HOLD_MS);
  }, [loopMode, phase, reduced, later, startRun]);

  // Reduced motion resolves immediately to the finished composition; nothing
  // needs to be scheduled, so the phase is derived rather than stored.
  useEffect(() => {
    if (!reduced) return;
    clearTimers();
    stopLoop();
  }, [reduced, clearTimers, stopLoop]);

  const value = useMemo<TakeValue>(
    () => ({
      takeMode,
      loopMode,
      reduced,
      phase: reduced ? "held" : phase,
      runId,
      started: started || reduced || !takeMode,
      ready,
      subscribeFrame,
      replay,
    }),
    [takeMode, loopMode, reduced, phase, runId, started, ready, subscribeFrame, replay],
  );

  return <TakeContext.Provider value={value}>{children}</TakeContext.Provider>;
}
