import { redrawObjects } from "."
import {
  $svgElements,
  objects,
  selectedObject,
  updateSelectedObject,
} from "../app"
import { IObject } from "../objects/data"
import { getColorFromMaterial } from "../objects/helper"

const gridSize: number = 10
const defaultRadius: number = 10000
const width = (): number => $svgElements.$svg.clientWidth
const height = (): number => $svgElements.$svg.clientHeight

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
  id: string,
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
      selectedObject && selectedObject.id === id ? "red" : color
    };stroke:rgb(0,0,0);stroke-width:0.5`
  )
  $polygon.setAttribute("id", "svg-" + id)
  configureEventHandlers($polygon, id)

  $svgElements.$groupObjects.appendChild($polygon)
}

function drawCircle(
  id: string,
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
  $circle.setAttribute("id", "svg-" + id)
  $circle.setAttribute(
    "style",
    `fill:${
      selectedObject && selectedObject.id === id ? "red" : color
    };stroke:rgb(0,0,0);stroke-width:0.5`
  )
  configureEventHandlers($circle, id)

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
      drawPoly(
        obj.id,
        getColorFromMaterial(obj.material) ?? "lightgray",
        points_
      )
      break
    case "ball":
      drawCircle(
        obj.id,
        getColorFromMaterial(obj.material) ?? obj.color ?? "purple",
        obj.x,
        obj.y,
        (obj.params[0] as number | undefined) ?? defaultRadius
      )
      break
    case "poly":
      const [_, ...points] = obj.params
      console.log(points)
      drawPoly(
        obj.id,
        getColorFromMaterial(obj.material) ?? "lightgray",
        (points as [number, number][]).map(([x, y]) => ({ x, y }))
      )
      break
    case "unknown":
      console.log("draw unknown shape")
      drawCircle(obj.id, obj.material, obj.x, obj.y, defaultRadius)
      break
    default:
      console.log("Not sure how to draw", obj)
  }
}

function configureEventHandlers($element: SVGElement, id: string) {
  const obj = objects.find(({ id: id_ }) => id === id_)
  $element.onmousedown = () => {
    if (obj === selectedObject) return
    const oldSelectedObject = selectedObject
    updateSelectedObject(obj)
    redrawObjects(oldSelectedObject, obj)
  }
}

export function snapToGrid(coordinate: number) {
  const rest = coordinate % gridSize
  if (rest < gridSize / 2) {
    return coordinate - rest
  }
  return coordinate + (gridSize - rest)
}
