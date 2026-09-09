/**
 * Synthetic pointer plumbing for take mode.
 *
 * The fake cursor is the only "mouse" in a take, so its visual position and the
 * clientX/clientY it reports must agree exactly. Three things happen per frame:
 *
 *  1. A `mousemove` is dispatched on `document` — always, unconditionally.
 *
 *  2. A hit test finds the topmost element under the cursor and, when it
 *     changes, emits `mouseout`/`mouseover` with the correct `relatedTarget`.
 *     React synthesises `onMouseEnter`/`onMouseLeave` from those two native
 *     events, which is what flips Aceternity's `isMouseEntered` and makes the
 *     3D card's layers lift. A bare `mousemove` would tilt the card but leave
 *     every CardItem flat.
 *
 *  3. Explicitly registered elements receive the move directly. Background
 *     effect hosts — React Bits' Threads binds `mousemove` on its own
 *     container, not on document — sit behind foreground content and would
 *     never win a hit test, so they would otherwise never react at all.
 */

const cursorTargets = new Set<Element>();

/** Registers a background effect host to receive the move directly. */
export function registerCursorTarget(el: Element | null): () => void {
  if (!el) return () => {};
  cursorTargets.add(el);
  return () => {
    cursorTargets.delete(el);
  };
}

export type PointerState = {
  lastTarget: Element | null;
  buttons: number;
  pressedTarget: Element | null;
};

export function createPointerState(): PointerState {
  return { lastTarget: null, buttons: 0, pressedTarget: null };
}

type Init = { clientX: number; clientY: number; buttons: number };

function mouseInit(
  { clientX, clientY, buttons }: Init,
  relatedTarget: EventTarget | null = null,
): MouseEventInit {
  return {
    clientX,
    clientY,
    screenX: clientX,
    screenY: clientY,
    button: 0,
    buttons,
    bubbles: true,
    cancelable: true,
    composed: true,
    view: window,
    relatedTarget,
  };
}

function pointerInit(init: Init): PointerEventInit {
  return {
    ...mouseInit(init),
    pointerId: 1,
    pointerType: "mouse",
    isPrimary: true,
    width: 1,
    height: 1,
    pressure: init.buttons ? 0.5 : 0,
  };
}

/**
 * One frame of cursor movement. `clientX`/`clientY` are already in browser
 * coordinates — the stage-space conversion happens in DemoCursor.
 */
export function dispatchCursorMove(
  clientX: number,
  clientY: number,
  state: PointerState,
): void {
  const init: Init = { clientX, clientY, buttons: state.buttons };

  // 1. Mandatory document-level move.
  document.dispatchEvent(new MouseEvent("mousemove", mouseInit(init)));

  // 2. Hit test + enter/leave synthesis.
  const target = document.elementFromPoint(clientX, clientY);
  if (target !== state.lastTarget) {
    if (state.lastTarget) {
      state.lastTarget.dispatchEvent(
        new MouseEvent("mouseout", mouseInit(init, target)),
      );
      state.lastTarget.dispatchEvent(
        new PointerEvent("pointerout", { ...pointerInit(init), relatedTarget: target }),
      );
    }
    if (target) {
      target.dispatchEvent(
        new PointerEvent("pointerover", {
          ...pointerInit(init),
          relatedTarget: state.lastTarget,
        }),
      );
      target.dispatchEvent(
        new MouseEvent("mouseover", mouseInit(init, state.lastTarget)),
      );
    }
    state.lastTarget = target;
  }
  if (target) {
    target.dispatchEvent(new PointerEvent("pointermove", pointerInit(init)));
    target.dispatchEvent(new MouseEvent("mousemove", mouseInit(init)));
  }

  // 3. Registered background effect hosts.
  for (const el of cursorTargets) {
    if (el === target) continue;
    el.dispatchEvent(new MouseEvent("mousemove", mouseInit(init)));
  }
}

/** pointerdown + mousedown. The button stays held until `release`. */
export function dispatchPress(
  clientX: number,
  clientY: number,
  state: PointerState,
): void {
  const target = document.elementFromPoint(clientX, clientY) ?? state.lastTarget;
  if (!target) return;
  state.buttons = 1;
  state.pressedTarget = target;
  const init: Init = { clientX, clientY, buttons: 1 };
  target.dispatchEvent(new PointerEvent("pointerdown", pointerInit(init)));
  target.dispatchEvent(new MouseEvent("mousedown", mouseInit(init)));
}

/** mouseup + pointerup, optionally followed by a click. */
export function dispatchRelease(
  clientX: number,
  clientY: number,
  state: PointerState,
  withClick = false,
): void {
  const target =
    document.elementFromPoint(clientX, clientY) ??
    state.pressedTarget ??
    state.lastTarget;
  state.buttons = 0;
  if (!target) return;
  const init: Init = { clientX, clientY, buttons: 0 };
  target.dispatchEvent(new MouseEvent("mouseup", mouseInit(init)));
  target.dispatchEvent(new PointerEvent("pointerup", pointerInit(init)));
  if (withClick) target.dispatchEvent(new MouseEvent("click", mouseInit(init)));
  state.pressedTarget = null;
}

/** Full atomic press + release + click. */
export function dispatchClick(
  clientX: number,
  clientY: number,
  state: PointerState,
): void {
  dispatchPress(clientX, clientY, state);
  dispatchRelease(clientX, clientY, state, true);
}

/** Clears hover state by leaving the current target for `document`. */
export function dispatchHoverOut(
  clientX: number,
  clientY: number,
  state: PointerState,
): void {
  const init: Init = { clientX, clientY, buttons: state.buttons };
  if (state.lastTarget) {
    state.lastTarget.dispatchEvent(
      new MouseEvent("mouseout", mouseInit(init, document.body)),
    );
    state.lastTarget.dispatchEvent(
      new MouseEvent("mouseleave", {
        ...mouseInit(init, document.body),
        bubbles: false,
      }),
    );
  }
  for (const el of cursorTargets) {
    el.dispatchEvent(
      new MouseEvent("mouseleave", { ...mouseInit(init), bubbles: false }),
    );
  }
  state.lastTarget = null;
}
