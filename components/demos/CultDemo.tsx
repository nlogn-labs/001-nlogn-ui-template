"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  HeroLiquidMetalRoot,
  HeroLiquidMetalVisual,
} from "@/components/ui/hero-liquid-metal";
import { Reveal } from "@/components/demos/Reveal";
import { CornerMarks } from "@/components/demos/ui/CornerMarks";
import { Grain } from "@/components/demos/ui/Grain";
import { useWordmarkImage } from "@/components/demos/useWordmarkImage";
import { brand } from "@/lib/brand";
import { easeInOutCubic } from "@/lib/take/easing";
import { useTake } from "@/lib/take/take-context";

const SUPPORT = "Interface engineering for software that has to feel exact.";

/** Resting shader state. The take rides on top of these. */
const BASE = { distortion: 0.16, contour: 0.24, repetition: 5 };
const PEAK = { distortion: 0.74, contour: 0.66, repetition: 7.4 };

/**
 * Deformation envelope. Flat while the composition establishes, strongest at
 * 2.0s, fully resolved by 3.3s so the last ~0.7s is a stable hold.
 */
function envelope(elapsed: number): number {
  if (elapsed <= 700) return 0;
  if (elapsed <= 2000) return easeInOutCubic((elapsed - 700) / 1300);
  if (elapsed <= 3300) return easeInOutCubic(1 - (elapsed - 2000) / 1300);
  return 0;
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Isolated so the shader's props can change without re-rendering the rest of
 * the route. Updates are throttled to ~30fps: the deformation is a slow swell,
 * and driving a React prop at 60fps buys nothing visible.
 */
function LiquidWordmark({ image }: { image: HTMLImageElement }) {
  const { subscribeFrame, takeMode, reduced, runId } = useTake();
  // Tagged with the run it belongs to, so a loop reset falls back to BASE
  // during render instead of through a setState in an effect.
  const [written, setWritten] = useState({ run: -1, shape: BASE });
  const shape = written.run === runId ? written.shape : BASE;
  const lastWrite = useRef(0);

  useEffect(() => {
    if (!takeMode || reduced) return;
    lastWrite.current = 0;
    let lastDistortion = BASE.distortion;
    return subscribeFrame((elapsed) => {
      if (elapsed - lastWrite.current < 33) return;
      lastWrite.current = elapsed;
      const t = envelope(elapsed);
      const next = {
        distortion: mix(BASE.distortion, PEAK.distortion, t),
        contour: mix(BASE.contour, PEAK.contour, t),
        repetition: mix(BASE.repetition, PEAK.repetition, t),
      };
      // The envelope is flat for the first 700ms and after 3300ms; skipping
      // no-op writes keeps the shader subtree from re-rendering for nothing.
      if (Math.abs(next.distortion - lastDistortion) < 0.002) return;
      lastDistortion = next.distortion;
      setWritten({ run: runId, shape: next });
    });
  }, [subscribeFrame, takeMode, reduced, runId]);

  // Stable identity unless the deformation actually moved: a fresh props
  // object on every render makes the memoized shader re-process its image,
  // which stalls the main thread for most of a second at TAKE_START.
  const shaderProps = useMemo(
    () => ({ ...shape, image, speed: reduced ? 0 : 0.55 }),
    [shape, image, reduced],
  );

  return (
    <HeroLiquidMetalVisual
      className="absolute top-[161px] left-1/2 block h-[340px] w-[1200px] -translate-x-1/2"
      // Wrapper treatment, not a source edit: the color-burn tint pushes the
      // metal past the accent into an electric blue, so saturation and
      // brightness are pulled back until the mark reads as accent-on-black.
      style={{ filter: "saturate(0.68) brightness(0.94)" }}
      desktopClassName="rounded-none"
      desktopShaderProps={shaderProps}
    />
  );
}

/** Leaf consumer: keeps the take's state changes out of the shader subtree. */
function SupportLine() {
  const { started, ready, reduced } = useTake();
  return (
    // The positioning transform lives on the wrapper: Reveal animates
    // `transform` itself, so putting -translate-x-1/2 on the same element
    // would silently drop the centring the moment the reveal ran.
    <div className="absolute top-[606px] left-1/2 w-[760px] -translate-x-1/2 text-center">
      <Reveal
        active={ready && started}
        delay={reduced ? 0 : 140}
        duration={640}
        y={14}
      >
        <p className="text-body text-muted">{SUPPORT}</p>
      </Reveal>
    </div>
  );
}

export function CultDemo() {
  const image = useWordmarkImage("NLOGN");

  return (
    <HeroLiquidMetalRoot
      className="absolute inset-0"
      srTitle="NLOGN"
      showCta={false}
      showBadges={false}
      width={1200}
      height={340}
      colorBack={`${brand.bg}00`}
      colorTint={brand.accent}
      softness={0.78}
      shiftRed={0}
      shiftBlue={0}
      angle={0}
      scale={0.92}
      fit="contain"
      // Documented budget knobs: resolution comes down before motion quality.
      minPixelRatio={1}
      maxPixelCount={640 * 640}
    >
      <Grain opacity={0.05} />
      <CornerMarks />

      {/* Rules flanking the mark at its optical centre: the wordmark reads as
          set into a line of type rather than floating in the middle of a
          black frame. */}
      <div className="absolute top-[410px] left-20 h-px w-[150px] bg-hairline" />
      <div className="absolute top-[410px] right-20 h-px w-[150px] bg-hairline" />

      {/* Held back until the mark exists: without an `image` the component
          falls back to Cult UI's own demo icon path, which this project has
          no reason to ship. */}
      {image ? <LiquidWordmark image={image} /> : null}
      <SupportLine />
    </HeroLiquidMetalRoot>
  );
}
