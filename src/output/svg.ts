import { redrawObjects } from "."
import { $svgElements, selectedObjects, updateSelectedObjects } from "../app"
import { IObject, Point } from "../types"
import { getCenterFromObjects, getColorFromMaterial } from "../objects/helper"

const gridSize: number = 10
const defaultRadius: number = 10000
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
  const style = "stroke:rgb(50,50,50);stroke-width:0.1"

  for (var y = gridSize; y < width(); y += gridSize) {
    const $line = document.createElementNS("http://www.w3.org/2000/svg", "line")
    $line.setAttribute("x1", "" + y)
    $line.setAttribute("y1", "" + 0)
    $line.setAttribute("x2", "" + y)
    $line.setAttribute("y2", "" + height())
    $line.setAttribute("style", style)
    $svgElements.$groupBackground.appendChild($line)
  }

  for (var y = gridSize; y < height(); y += gridSize) {
    const $line = document.createElementNS("http://www.w3.org/2000/svg", "line")
    $line.setAttribute("x1", "" + 0)
    $line.setAttribute("y1", "" + y)
    $line.setAttribute("x2", "" + width())
    $line.setAttribute("y2", "" + y)
    $line.setAttribute("style", style)
    $svgElements.$groupBackground.appendChild($line)
  }
}

export function drawHorizontalLine(y: number) {
  const $line = document.createElementNS("http://www.w3.org/2000/svg", "line")
  $line.setAttribute("x1", "" + 0)
  $line.setAttribute("y1", "" + y)
  $line.setAttribute("x2", "" + width())
  $line.setAttribute("y2", "" + y)
  $line.setAttribute("style", "stroke:rgb(255,0,0);stroke-width:2")

  $svgElements.$groupBackground.appendChild($line)
}

export function drawPoly(
  object: IObject,
  color: string,
  points: { x: number; y: number }[]
) {
  //   <polygon points="200,10 250,190 160,210" style="fill:lime;stroke:purple;stroke-width:1" />
  const $polygon = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polygon"
  )
  $polygon.setAttribute(
    "points",
    points.map((point) => point.x + "," + point.y).join(" ")
  )
  $polygon.setAttribute(
    "style",
    `fill:${
      selectedObjects.includes(object) ? "red" : color
    };stroke:rgb(0,0,0);stroke-width:0.5`
  )
  $polygon.setAttribute("id", "svg-" + object.id)
  configureEventHandlers($polygon, object)

  $svgElements.$groupObjects.appendChild($polygon)
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
  $circle.setAttribute("cx", "" + cx)
  $circle.setAttribute("cy", "" + cy)
  $circle.setAttribute("r", "" + radius)
  $circle.setAttribute("id", "svg-" + object.id)
  $circle.setAttribute(
    "style",
    `fill:${
      selectedObjects.includes(object) ? "red" : color
    };stroke:rgb(0,0,0);stroke-width:0.5`
  )
  configureEventHandlers($circle, object)

  $svgElements.$groupObjects.appendChild($circle)
}

function rotShift(
  angle: number,
  cx: number,
  cy: number,
  list: [number, number][]
): [number, number][] {
  const [[x, y], ...remainingList] = list
  const xr = x * Math.cos(angle) - y * Math.sin(angle)
  const yr = x * Math.sin(angle) + y * Math.cos(angle)
  const xrs = xr + cx
  const yrs = yr + cy
  if (!remainingList || !remainingList.length) {
    return [[xrs, yrs]]
  }
  return [[xrs, yrs], ...rotShift(angle, cx, cy, remainingList)]
}

export function drawShape(obj: IObject) {
  switch (obj.shape) {
    case "rect":
      const [w, h, angle] = obj.params

      const XRa = +h * 0.5 // TODO: not sure why but needs this scaling factor to work
      const YRa = +w * 0.5 // TODO: not sure why but needs this scaling factor to work
      const points_ = rotShift(angle as number, obj.x, obj.y, [
        [-XRa, -YRa],
        [-XRa, YRa],
        [XRa, YRa],
        [XRa, -YRa],
      ]).map(([x, y]: [number, number]) => ({ x, y }))
      drawPoly(obj, getColorFromMaterial(obj.material) ?? "lightgray", points_)
      break
    case "ball":
      drawCircle(
        obj,
        getColorFromMaterial(obj.material) ?? obj.color ?? "purple",
        obj.x,
        obj.y,
        (obj.params[0] as number | undefined) ?? defaultRadius
      )
      break
    case "poly":
      const [_, ...points] = obj.params
      drawPoly(
        obj,
        getColorFromMaterial(obj.material) ?? "lightgray",
        (points as [number, number][]).map(([x, y]) => ({ x, y }))
      )
      break
    case "unknown":
      console.log("draw unknown shape")
      drawCircle(obj, obj.material, obj.x, obj.y, defaultRadius)
      break
    default:
      console.log("Not sure how to draw", obj)
  }
}

function configureEventHandlers($element: SVGElement, object: IObject) {
  if (!object) {
    console.error("Failed to set up event handlers for ", object)
    return
  }
  $element.onmousedown = (event) => {
    const indexIfSelected = selectedObjects.indexOf(object)

    console.log(indexIfSelected)

    const oldSelectedObject = [...selectedObjects]
    if (event.ctrlKey) {
      if (indexIfSelected !== -1) {
        // deselect
        updateSelectedObjects(selectedObjects.filter((obj) => obj !== object))
        console.log("deselect Object")
      } else {
        // add to selection
        updateSelectedObjects([...selectedObjects, object])
        console.log("add Object to selection")
      }
    } else {
      if (indexIfSelected !== -1) return
      updateSelectedObjects([object])
    }
  }
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
  $selectionRectangle.setAttribute("x", "" + x)
  $selectionRectangle.setAttribute("y", "" + y)
  $selectionRectangle.setAttribute(
    "style",
    "stroke-width:1;stroke:purple;fill-opacity:.1"
  )
  $svgElements.$groupOverlay.appendChild($selectionRectangle)

  return $selectionRectangle
}

export function updateSelectionRectangle(
  $selectionRectangle: SVGElement,
  start: { x: number; y: number },
  end: { x: number; y: number }
) {
  // via https://stackoverflow.com/a/61221651
  $selectionRectangle.setAttribute("x", "" + Math.min(start.x, end.x))
  $selectionRectangle.setAttribute("y", "" + Math.min(start.y, end.y))
  $selectionRectangle.setAttribute("width", "" + Math.abs(start.x - end.x))
  $selectionRectangle.setAttribute("height", "" + Math.abs(start.y - end.y))
}

function getSelectionRectangle() {
  const $existingRectangle = $svgElements.$groupOverlay.querySelector(
    "#selectionRectangle"
  ) as SVGAElement | null
  if ($existingRectangle) {
    return $existingRectangle
  }

  const $newRectangle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "rect"
  )
  $newRectangle.setAttribute("style", "stroke-width:1;stroke:purple")
  $newRectangle.setAttribute("id", "selectionRectangle")
  $svgElements.$groupOverlay.appendChild($newRectangle)

  return $newRectangle
}

export function hideSelectionRectangle($rectangle: SVGElement | undefined) {
  if (!$rectangle) {
    return
  }
  $rectangle.setAttribute("hidden", "true")
}

export function showCenter(objects: IObject[]) {
  if (!objects.length) return

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
  const style = "stroke:black;stroke-width:2;opacity:.4"

  const $horizontalLine = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "line"
  )
  $horizontalLine.setAttribute("x1", "" + (x - crossSize))
  $horizontalLine.setAttribute("y1", "" + y)
  $horizontalLine.setAttribute("x2", "" + (x + crossSize))
  $horizontalLine.setAttribute("y2", "" + y)
  $horizontalLine.setAttribute("style", style)

  const $verticalLine = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "line"
  )
  $verticalLine.setAttribute("x1", "" + x)
  $verticalLine.setAttribute("y1", "" + (y + crossSize))
  $verticalLine.setAttribute("x2", "" + x)
  $verticalLine.setAttribute("y2", "" + (y - crossSize))
  $verticalLine.setAttribute("style", style)

  const $group = document.createElementNS("http://www.w3.org/2000/svg", "g")
  $group.setAttribute("id", "svg-center")

  $group.append($horizontalLine, $verticalLine)

  $svgElements.$groupOverlay.append($group)
}
