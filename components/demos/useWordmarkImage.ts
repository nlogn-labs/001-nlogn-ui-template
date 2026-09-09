"use client";

import { useEffect, useState } from "react";

import { brand } from "@/lib/brand";

/**
 * Renders a word in the brand display face to a transparent bitmap.
 *
 * Cult UI's LiquidMetal takes the shape it deforms as an `image`
 * (`string | HTMLImageElement`) — that is the documented way to drive it with
 * your own mark. Drawing the word to a canvas keeps the real webfont, needs no
 * glyph-outline extraction step, and passes the result straight into the
 * exposed prop rather than touching the shader.
 */
export function useWordmarkImage(
  text: string,
  { weight = 600, letterSpacing = "0.02em", padding = 24 } = {},
): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const build = async () => {
      // The face has to be resolved before measuring, or the metrics come from
      // the fallback and the mark is the wrong shape.
      await document.fonts.ready;
      if (cancelled) return;

      const family = getComputedStyle(document.body).fontFamily;
      const size = 400;
      const dpr = 2;

      const measurer = document.createElement("canvas").getContext("2d");
      if (!measurer) return;
      measurer.font = `${weight} ${size}px ${family}`;
      measurer.letterSpacing = letterSpacing;
      const m = measurer.measureText(text);

      const w = Math.ceil(m.actualBoundingBoxLeft + m.actualBoundingBoxRight) + padding * 2;
      const h = Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) + padding * 2;

      const canvas = document.createElement("canvas");
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.font = `${weight} ${size}px ${family}`;
      ctx.letterSpacing = letterSpacing;
      // The mark is a mask for the shader, but it still resolves to a token.
      ctx.fillStyle = brand.text;
      ctx.textBaseline = "alphabetic";
      ctx.fillText(text, padding + m.actualBoundingBoxLeft, padding + m.actualBoundingBoxAscent);

      const img = new Image();
      img.onload = () => {
        if (!cancelled) setImage(img);
      };
      img.src = canvas.toDataURL("image/png");
    };

    void build();
    return () => {
      cancelled = true;
    };
  }, [text, weight, letterSpacing, padding]);

  return image;
}
