import { setUpKeyboardEventHandlers } from "./keyboardEventHandler"
import { setUpMouseEventHandlers } from "./mouseEventHandler"

export function setUpEventHandlers(svg: HTMLElement): void {
  /* CONTROLS */
  setUpKeyboardEventHandlers()

  /* DRAGGABLE SVG ELEMENTS */
  setUpMouseEventHandlers(svg)
}
