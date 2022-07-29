import { objects, selectedObjects, updateSelectedObjects } from "../app"
import {
  translatePolyObject,
  getObjectsWithinBoundary,
} from "../objects/helper"
import { redrawObjects, updateCenter } from "../output"
import {
  hideSelectionRectangle,
  initializeSelectionRectangle,
  snapToGrid,
  updateSelectionRectangle,
} from "../output/svg"

function getMousePosition(svg: HTMLElement, event: MouseEvent | TouchEvent) {
  var CTM = (svg as unknown as SVGGraphicsElement).getScreenCTM()
  if (!CTM) {
    throw new Error("Could not determine Mouse Location")
  }
  var mouseEvent: MouseEvent
  if (event instanceof TouchEvent && event.touches) {
    mouseEvent = event.touches[0] as unknown as MouseEvent
  } else {
    mouseEvent = event as MouseEvent
  }
  return {
    x: (mouseEvent.clientX - CTM.e) / CTM.a,
    y: (mouseEvent.clientY - CTM.f) / CTM.d,
  }
}

export function setUpMouseEventHandlers(svg: HTMLElement) {
  svg.addEventListener("mousedown", startDragOrSelect)
  svg.addEventListener("mousemove", dragOrSelect)
  svg.addEventListener("mouseup", endDragOrSelect)
  svg.addEventListener("touchstart", startDragOrSelect)
  svg.addEventListener("touchmove", dragOrSelect)
  svg.addEventListener("touchend", endDragOrSelect)
  svg.addEventListener("touchcancel", endDragOrSelect)

  var mouseStartPosition: { x: number; y: number },
    preDragCoordinates: { x: number; y: number }[],
    isDrag: boolean,
    isSelect: boolean,
    $selectionRectangle: SVGElement | undefined

  function startDragOrSelect(event: MouseEvent | TouchEvent) {
    if (event.ctrlKey) return
    if (
      !event.target ||
      (event.target as HTMLElement).tagName === "svg" ||
      !selectedObjects
    ) {
      if (event.target && (event.target as HTMLElement).tagName === "svg") {
        isSelect = true
        mouseStartPosition = getMousePosition(svg, event)
        $selectionRectangle = initializeSelectionRectangle(
          mouseStartPosition.x,
          mouseStartPosition.y
        )
        console.log("Start selecting")
      }
      return
    }

    console.log("start drag")
    preDragCoordinates = selectedObjects.map(({ x, y }) => ({ x, y }))
    isDrag = true
    mouseStartPosition = getMousePosition(svg, event)
  }

  function dragOrSelect(event: MouseEvent | TouchEvent) {
    if (isSelect) {
      event.preventDefault()
      var currentMousePosition = getMousePosition(svg, event)
      updateSelectionRectangle(
        $selectionRectangle!,
        mouseStartPosition,
        currentMousePosition
      )
    }
    if (selectedObjects && isDrag) {
      event.preventDefault()
      var currentMousePosition = getMousePosition(svg, event)

      selectedObjects.forEach((object, index) => {
        var newX =
          preDragCoordinates[index].x +
          (currentMousePosition.x - mouseStartPosition.x)
        var newY =
          preDragCoordinates[index].y +
          (currentMousePosition.y - mouseStartPosition.y)

        if (event.ctrlKey) {
          newX = snapToGrid(newX)
          newY = snapToGrid(newY)
        }

        const xOffset = newX - object.x
        const yOffset = newY - object.y
        object.x = newX
        object.y = newY
        if (object.shape === "poly") {
          translatePolyObject(object, xOffset, yOffset)
        }
      })
      redrawObjects(selectedObjects)
      updateCenter(selectedObjects)
    }
  }

  function endDragOrSelect(event: MouseEvent | TouchEvent) {
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
      hideSelectionRectangle($selectionRectangle)
    }
    isDrag = false
    isSelect = false
  }
}
