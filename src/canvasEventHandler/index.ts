import { setUpKeyboardEventHandlers } from "./keyboardEventHandler"
import { setUpMouseEventHandlers } from "./mouseEventHandler"

/**
 * Sets up keyboard event handlers {@link setUpKeyboardEventHandlers} globally and mouse/touch
 * event handlers {@link setUpMouseEventHandlers} on the given SVG canvas
 *
 * @param svg - the SVG canvas to which the mouse/touch event handlers will be bound
 */
export function setUpEventHandlers(svg: HTMLElement): void {
  /* CONTROLS */
  setUpKeyboardEventHandlers()

  /* DRAGGABLE SVG ELEMENTS + SELECTION */
  setUpMouseEventHandlers(svg)
}
