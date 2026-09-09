/** Stage-space cursor choreography. Coordinates are 0..1600 x 0..900. */
export type CursorAction = "click" | "hover-out" | "press" | "release";

export type CursorKeyframe = {
  /** Stage X, 0..1600. */
  x: number;
  /** Stage Y, 0..900. */
  y: number;
  /** Milliseconds relative to TAKE_START. */
  t: number;
  /**
   * `click`    — full pointerdown/mousedown/mouseup/click sequence.
   * `press`    — pointerdown + mousedown only; the button stays held.
   * `release`  — mouseup + pointerup (+ click) to end a held press.
   * `hover-out`— clears hover state by emitting mouseout toward `document`.
   *
   * `press`/`release` are a deliberate minimal extension of the action model:
   * Kokonut UI's HoldButton binds onMouseDown/onMouseUp with real elapsed time
   * between them, which an atomic `click` cannot express.
   */
  action?: CursorAction;
};

export const STAGE_W = 1600;
export const STAGE_H = 900;
export const SAFE = 80;
