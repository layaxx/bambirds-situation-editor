import { $svgElements, selectedObjects, updateSelectedObjects } from "../app"
import { IObject, Point } from "../types"
import { getCenterFromObjects } from "../objects/helper"
import {
  CENTER_CROSS_COLOR,
  CIRCLE_STROKE_COLOR,
  FALLBACK_COLOR,
  getColorFromMaterial,
  GRID_COLOR,
  HORIZON_LINE_COLOR,
  SELECTED_OBJECT_COLOR,
  SELECTION_RECTANGLE_COLOR,
} from "../objects/colors"

const gridSize = 10
const defaultRadius = 10_000
const width = (): number => $svgElements.$svg.clientWidth
const height = (): number => $svgElements.$svg.clientHeight

export function setUpGroups($svg: HTMLElement) {
  const $groupBackground = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  )
  $groupBackground.setAttribute("id", "group-background")
  const $groupObjects = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  )
  $groupObjects.setAttribute("id", "group-objects")
  const $groupOverlay = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  )
  $groupOverlay.setAttribute("id", "group-overlay")
  $svg.append($groupBackground, $groupObjects, $groupOverlay)

  return {
    $svg,
    $groupBackground,
    $groupObjects,
    $groupOverlay,
  }
}

export function drawGrid() {
  const style = `stroke:${GRID_COLOR};stroke-width:0.1`

  for (let y = gridSize; y < width(); y += gridSize) {
    const $line = document.createElementNS("http://www.w3.org/2000/svg", "line")
    $line.setAttribute("x1", String(y))
    $line.setAttribute("y1", String(0))
    $line.setAttribute("x2", String(y))
    $line.setAttribute("y2", String(height()))
    $line.setAttribute("style", style)
    $svgElements.$groupBackground.append($line)
  }

  for (let y = gridSize; y < height(); y += gridSize) {
    const $line = document.createElementNS("http://www.w3.org/2000/svg", "line")
    $line.setAttribute("x1", String(0))
    $line.setAttribute("y1", String(y))
    $line.setAttribute("x2", String(width()))
    $line.setAttribute("y2", String(y))
    $line.setAttribute("style", style)
    $svgElements.$groupBackground.append($line)
  }
}

export function drawHorizontalLine(y: number) {
  const $line = document.createElementNS("http://www.w3.org/2000/svg", "line")
  $line.setAttribute("x1", String(0))
  $line.setAttribute("y1", String(y))
  $line.setAttribute("x2", String(width()))
  $line.setAttribute("y2", String(y))
  $line.setAttribute("style", `stroke:${HORIZON_LINE_COLOR};stroke-width:2`)

  $svgElements.$groupBackground.append($line)
}

export function drawPoly(
  object: IObject,
  color: string,
  points: Array<{ x: number; y: number }>
) {
  const $polygon = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polygon"
  )
  $polygon.setAttribute(
    "points",
    points.map((point) => `${point.x},${point.y}`).join(" ")
  )
  $polygon.setAttribute(
    "style",
    `fill:${
      selectedObjects.includes(object) ? SELECTED_OBJECT_COLOR : color
    };stroke:${CIRCLE_STROKE_COLOR};stroke-width:0.5`
  )
  $polygon.setAttribute("id", "svg-" + object.id)
  configureEventHandlers($polygon, object)

  $svgElements.$groupObjects.append($polygon)
}

function drawCircle(
  object: IObject,
  color: string,
  cx: number,
  cy: number,
  radius: number
) {
  const $circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  )
  $circle.setAttribute("cx", String(cx))
  $circle.setAttribute("cy", String(cy))
  $circle.setAttribute("r", String(radius))
  $circle.setAttribute("id", "svg-" + object.id)
  $circle.setAttribute(
    "style",
    `fill:${
      selectedObjects.includes(object) ? SELECTED_OBJECT_COLOR : color
    };stroke:${CIRCLE_STROKE_COLOR};stroke-width:0.5`
  )
  configureEventHandlers($circle, object)

  $svgElements.$groupObjects.append($circle)
}

function rotShift(
  angle: number,
  cx: number,
  cy: number,
  list: Array<[number, number]>
): Array<[number, number]> {
  const [[x, y], ...remainingList] = list
  const xr = x * Math.cos(angle) - y * Math.sin(angle)
  const yr = x * Math.sin(angle) + y * Math.cos(angle)
  const xrs = xr + cx
  const yrs = yr + cy
  if (!remainingList || remainingList.length === 0) {
    return [[xrs, yrs]]
  }

  return [[xrs, yrs], ...rotShift(angle, cx, cy, remainingList)]
}

export function drawShape(object: IObject) {
  switch (object.shape) {
    case "rect": {
      const [w, h, angle] = object.params

      const halfHeight = Number(h) * 0.5
      const halfWidth = Number(w) * 0.5
      const points = rotShift(angle as number, object.x, object.y, [
        [-halfHeight, -halfWidth],
        [-halfHeight, halfWidth],
        [halfHeight, halfWidth],
        [halfHeight, -halfWidth],
      ]).map(([x, y]: [number, number]) => ({ x, y }))
      drawPoly(
        object,
        getColorFromMaterial(object.material) ?? FALLBACK_COLOR,
        points
      )
      break
    }

    case "ball":
      drawCircle(
        object,
        getColorFromMaterial(object.material) ?? object.color ?? FALLBACK_COLOR,
        object.x,
        object.y,
        (object.params[0] as number | undefined) ?? defaultRadius
      )
      break

    case "poly": {
      const [_, ...points] = object.params
      drawPoly(
        object,
        getColorFromMaterial(object.material) ?? FALLBACK_COLOR,
        (points as Array<[number, number]>).map(([x, y]) => ({ x, y }))
      )
      break
    }

    case "unknown":
      console.log("draw unknown shape")
      drawCircle(object, object.material, object.x, object.y, defaultRadius)
      break
    default:
      console.log("Not sure how to draw", object)
  }
}

function configureEventHandlers($element: SVGElement, object: IObject) {
  if (!object) {
    console.error("Failed to set up event handlers for", object)
    return
  }

  $element.addEventListener("mousedown", (event) => {
    const indexIfSelected = selectedObjects.indexOf(object)

    if (event.ctrlKey) {
      if (indexIfSelected === -1) {
        // Add to selection
        updateSelectedObjects([...selectedObjects, object])
        console.log("add Object to selection")
      } else {
        // Deselect
        updateSelectedObjects(
          selectedObjects.filter((selectedObject) => selectedObject !== object)
        )
        console.log("deselect Object")
      }
    } else {
      if (indexIfSelected !== -1) return
      updateSelectedObjects([object])
    }
  })
}

export function snapToGrid(coordinate: number) {
  const rest = coordinate % gridSize
  if (rest < gridSize / 2) {
    return coordinate - rest
  }

  return coordinate + (gridSize - rest)
}

export function initializeSelectionRectangle(x: number, y: number): SVGElement {
  const $selectionRectangle = getSelectionRectangle()
  $selectionRectangle.removeAttribute("hidden")
  $selectionRectangle.setAttribute("width", "1")
  $selectionRectangle.setAttribute("height", "1")
  $selectionRectangle.setAttribute("x", String(x))
  $selectionRectangle.setAttribute("y", String(y))
  $selectionRectangle.setAttribute(
    "style",
    "stroke-width:1;stroke:" + SELECTION_RECTANGLE_COLOR + ";fill-opacity:.1"
  )
  $svgElements.$groupOverlay.append($selectionRectangle)

  return $selectionRectangle
}

export function updateSelectionRectangle(
  $selectionRectangle: SVGElement,
  start: { x: number; y: number },
  end: { x: number; y: number }
) {
  // Via https://stackoverflow.com/a/61221651
  $selectionRectangle.setAttribute("x", String(Math.min(start.x, end.x)))
  $selectionRectangle.setAttribute("y", String(Math.min(start.y, end.y)))
  $selectionRectangle.setAttribute("width", String(Math.abs(start.x - end.x)))
  $selectionRectangle.setAttribute("height", String(Math.abs(start.y - end.y)))
}

function getSelectionRectangle(): SVGElement {
  const $existingRectangle =
    $svgElements.$groupOverlay.querySelector<SVGElement>("#selectionRectangle")
  if ($existingRectangle) {
    return $existingRectangle
  }

  const $newRectangle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "rect"
  )
  $newRectangle.setAttribute("id", "selectionRectangle")
  $svgElements.$groupOverlay.append($newRectangle)

  return $newRectangle
}

export function hideSelectionRectangle($rectangle: SVGElement | undefined) {
  if (!$rectangle) {
    return
  }

  $rectangle.setAttribute("hidden", "true")
}

export function showCenter(objects: IObject[]) {
  if (objects.length === 0) return

  if (objects.length === 1) {
    const [{ x, y }] = objects
    drawCrossAt({ x, y })
    return
  }

  const { x, y } = getCenterFromObjects(objects)
  drawCrossAt({ x, y })
}

function drawCrossAt({ x, y }: Point) {
  const crossSize = 20
  const style = "stroke:" + CENTER_CROSS_COLOR + ";stroke-width:2;opacity:.4"

  const $horizontalLine = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "line"
  )
  $horizontalLine.setAttribute("x1", String(x - crossSize))
  $horizontalLine.setAttribute("y1", String(y))
  $horizontalLine.setAttribute("x2", String(x + crossSize))
  $horizontalLine.setAttribute("y2", String(y))
  $horizontalLine.setAttribute("style", style)

  const $verticalLine = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "line"
  )
  $verticalLine.setAttribute("x1", String(x))
  $verticalLine.setAttribute("y1", String(y + crossSize))
  $verticalLine.setAttribute("x2", String(x))
  $verticalLine.setAttribute("y2", String(y - crossSize))
  $verticalLine.setAttribute("style", style)

  const $group = document.createElementNS("http://www.w3.org/2000/svg", "g")
  $group.setAttribute("id", "svg-center")

  $group.append($horizontalLine, $verticalLine)

  $svgElements.$groupOverlay.append($group)
}
