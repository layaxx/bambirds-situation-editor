import { setUpKeyboardEventHandlers } from "./keyboardEventHandler"
import { setUpMouseEventHandlers } from "./mouseEventHandler"

export function setUpEventHandlers(svg: HTMLElement) {
  /* CONTROLS */
  setUpKeyboardEventHandlers()

  /* DRAGGABLE SVG ELEMENTS */
  setUpMouseEventHandlers(svg)
}
