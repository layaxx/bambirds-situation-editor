import {
  objects,
  selectedObjects,
  selectionMeta,
  updateSelectedObjects,
} from "../app"
import {
  getObjectsWithinBoundary,
  getCenterFromObjects,
} from "../objects/helper"
import { redrawObjects, updateCenter } from "../output"
import {
  hideElement,
  initializeSelectionRectangle,
  snapToGrid,
  updateSelectionRectangle,
} from "../output/svg"
import { updateTable } from "../output/table"
import { Point } from "../types"

/**
 * Returns the mouse/touch position over the given SVG canvas from the given mouse/touch event
 *
 * @param svg - the canvas on which the position is determined
 * @param event - the mouse of touch event whose position shall be calculates
 *
 * @returns the point on the canvas where the event occurred
 */
function getMousePosition(
  svg: HTMLElement,
  event: MouseEvent | TouchEvent
): Point {
  const CTM = (svg as unknown as SVGGraphicsElement).getScreenCTM()
  if (!CTM) {
    throw new Error("Could not determine Mouse Location")
  }

  const mouseEvent: MouseEvent =
    event instanceof TouchEvent && event.touches
      ? (event.touches[0] as unknown as MouseEvent)
      : (event as MouseEvent)
  return {
    x: (mouseEvent.clientX - CTM.e) / CTM.a,
    y: (mouseEvent.clientY - CTM.f) / CTM.d,
  }
}

/**
 * Sets up all relevant mouse/touch event handlers on the given SVG canvas such that
 * Selection and dragging of objects are possible
 *
 * @param svg - the SVG canvas to which the event handlers will be added
 */
export function setUpMouseEventHandlers(svg: HTMLElement): void {
  svg.addEventListener("mousedown", startDragOrSelect)
  svg.addEventListener("mousemove", dragOrSelect)
  svg.addEventListener("mouseup", endDragOrSelect)
  svg.addEventListener("touchstart", startDragOrSelect)
  svg.addEventListener("touchmove", dragOrSelect)
  svg.addEventListener("touchend", endDragOrSelect)
  svg.addEventListener("touchcancel", endDragOrSelect)

  /** Position of the mouse/touch at the beginning of a drag */
  let mouseStartPosition: Point
  /** Coordinates of the selected Objects at the beginning of drag */
  let preDragCoordinates: Point[]
  /** Boolean variable indicating whether drag is active */
  let isDrag: boolean
  /** Boolean variable indicating whether a selection is ongoing */
  let isSelect: boolean
  /** Selection rectangle if it exists */
  let $selectionRectangle: SVGElement | undefined

  /**
   * Event handler to start a drag or selection process
   *
   * @param event - mouse of drag event that initiates he process
   */
  function startDragOrSelect(event: MouseEvent | TouchEvent): void {
    if (event.ctrlKey) return
    if (
      !event.target ||
      (event.target as HTMLElement).tagName === "svg" ||
      !selectedObjects
    ) {
      if (event.target && (event.target as HTMLElement).tagName === "svg") {
        isSelect = true
        mouseStartPosition = getMousePosition(svg, event)
        $selectionRectangle = initializeSelectionRectangle(mouseStartPosition)
        console.log("Start selecting")
      }

      return
    }

    console.log("start drag")
    preDragCoordinates = selectedObjects.map(({ x, y }) => ({ x, y }))
    isDrag = true
    mouseStartPosition = getMousePosition(svg, event)
  }

  /**
   * Event handler for carrying out the actual selection or drag process
   *
   * @param event - mouse or touch event for current state
   */
  function dragOrSelect(event: MouseEvent | TouchEvent): void {
    if (isSelect) {
      event.preventDefault()
      const currentMousePosition = getMousePosition(svg, event)
      updateSelectionRectangle(
        $selectionRectangle!,
        mouseStartPosition,
        currentMousePosition
      )
    }

    if (selectedObjects && isDrag) {
      event.preventDefault()
      const currentMousePosition = getMousePosition(svg, event)

      for (const [index, object] of selectedObjects.entries()) {
        let newX =
          preDragCoordinates[index].x +
          (currentMousePosition.x - mouseStartPosition.x)
        let newY =
          preDragCoordinates[index].y +
          (currentMousePosition.y - mouseStartPosition.y)

        if (event.ctrlKey) {
          newX = snapToGrid(newX)
          newY = snapToGrid(newY)
        }

        object.moveTo({ x: newX, y: newY })
      }

      updateTable(...selectedObjects)
      redrawObjects(selectedObjects)
      updateCenter(selectedObjects)
    }
  }

  /**
   * Event handler that finishes the ongoing drag or selection process
   *
   * @param event - mouse or touch event that concludes the process
   */
  function endDragOrSelect(event: MouseEvent | TouchEvent): void {
    if (isSelect) {
      // Add all objects inside rectangle to selectedObjects
      const currentMousePosition = getMousePosition(svg, event)
      const upperLeftCorner = {
        x: Math.min(currentMousePosition.x, mouseStartPosition.x),
        y: Math.min(currentMousePosition.y, mouseStartPosition.y),
      }
      const lowerRightCorner = {
        x: Math.max(currentMousePosition.x, mouseStartPosition.x),
        y: Math.max(currentMousePosition.y, mouseStartPosition.y),
      }
      const newSelectedObjects = getObjectsWithinBoundary(
        objects,
        upperLeftCorner,
        lowerRightCorner
      )
      updateSelectedObjects(newSelectedObjects)
      hideElement($selectionRectangle)
      console.log(`Selected ${newSelectedObjects.length} objects`)
    }

    isDrag = false
    isSelect = false
  }
}
