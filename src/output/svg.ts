import { $svgElements, selectedObjects } from "../app"
import { Point, SVGElements } from "../types"
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
import { ABObject } from "../objects/angryBirdsObject"

/** Amount of pixels between each line in the background grid */
const gridSize = 10
/** Fallback radius to be used when radius for circle is undefined/unknown */
const defaultRadius = 100
/**
 * Helper function to get width of main svg canvas
 *
 * @returns width of the main svg canvas in pixels
 */
const width = (): number => $svgElements.$svg.clientWidth
/**
 * Helper function to get height of main svg canvas
 *
 * @returns height of the main svg canvas in pixels
 */
const height = (): number => $svgElements.$svg.clientHeight

/**
 * Function which generates 3 groups (´g´ on svg namespace) and appends those groups to a svg canvas
 * Groups are assigned the IDs "group-background", "group-objects" and "group-overlay"
 *
 * @param $svg - The SVG Canvas on which the generated groups are appended as children
 * @returns an object containing the $svg canvas and all generated groups
 */
export function setUpGroups($svg: HTMLElement): SVGElements {
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

/**
 * Function that draws a grid to the "group-background" group of the main svg canvas.
 * The Grid consists of horizontal and vertical lines, such that the entire canvas is covered
 * and all lines are of {@link gridSize} pixels apart
 */
export function drawGrid(): void {
  const commonOptions = {
    color: GRID_COLOR,
    strokeWidth: 0.1,
  }

  const svgWidth = width()
  const svgHeight = height()

  for (
    let offset = gridSize;
    offset < Math.max(svgWidth, svgHeight);
    offset += gridSize
  ) {
    if (offset < svgWidth) {
      drawVerticalLine(offset, $svgElements.$groupBackground, commonOptions)
    }

    if (offset < svgHeight) {
      drawHorizontalLine(offset, $svgElements.$groupBackground, commonOptions)
    }
  }
}

/**
 * Function that draws a single horizontal line to $target.
 * The line will be drawn from x = 0 to x = options.width iff options.width is defined,
 * else to $target.clientWidth iff that is truthy, otherwise to x = {@link width}()
 *
 * @param yCoordinate - y coordinate of the horizontal line. Remember that y = 0 is at the top
 * @param $target - SVGElement to which the line will be appended
 * @param options - optional configuration values:
 *  - options.color - optional color for the lines stroke
 *  - options.width - optional width for the line
 *  - options.strokeWidth - optional width for the lines stroke
 */
export function drawHorizontalLine(
  yCoordinate: number,
  $target: SVGElement,
  options?: {
    color?: string
    width?: number
    strokeWidth?: number
  }
): void {
  const $line = getGenericLine(
    { x: 0, y: yCoordinate },
    { x: options?.width ?? ($target.clientWidth || width()), y: yCoordinate },
    `stroke:${options?.color ?? HORIZON_LINE_COLOR};stroke-width:${
      options?.strokeWidth ?? 2
    }`
  )

  $target.append($line)
}

/**
 * Function that draws a single vertical line to $target.
 * The line will be drawn from y = 0 to y = options.width iff options.width is defined,
 * else to $target.clientHeight iff that is truthy, otherwise to y = {@link height}()
 *
 * @param xCoordinate - x coordinate of the vertical line
 * @param $target - SVGElement to which the line will be appended
 * @param options - optional configuration values
 *  - options.color - optional color for the lines stroke
 *  - options.height - optional height for the line
 *  - options.strokeWidth - optional width for the lines stroke
 */
export function drawVerticalLine(
  xCoordinate: number,
  $target: SVGElement,
  options?: { color?: string; height?: number; strokeWidth?: number }
): void {
  const $line = getGenericLine(
    { x: xCoordinate, y: 0 },
    {
      x: xCoordinate,
      y: options?.height ?? ($target.clientHeight || height()),
    },
    `stroke:${options?.color ?? HORIZON_LINE_COLOR};stroke-width:${
      options?.strokeWidth ?? 2
    }`
  )

  $target.append($line)
}

/**
 * Generates a SVG Line element between two points
 *
 * @param point1 - starting point of the line
 * @param point2 - end point of the line
 * @param style - style that is applied to the new element, e.g. configuration for stroke
 *
 * @returns the newly created line element
 */
function getGenericLine(
  point1: Point,
  point2: Point,
  style: string
): SVGElement {
  const $horizontalLine = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "line"
  )
  $horizontalLine.setAttribute("x1", String(point1.x))
  $horizontalLine.setAttribute("y1", String(point1.y))
  $horizontalLine.setAttribute("x2", String(point2.x))
  $horizontalLine.setAttribute("y2", String(point2.y))
  $horizontalLine.setAttribute("style", style)

  return $horizontalLine
}

/**
 * Creates a poly object and appends it to $target
 * The poly object is defined by a list of {@link Point}s
 *
 * @param $target - the element to which the new element is appended
 * @param object - the AngryBirds object this element represents
 * @param color - the fill color of the new element
 * @param points - the points that define the poly element
 * @returns the newly created object
 */
export function drawPoly(
  $target: SVGElement,
  object: ABObject,
  color: string,
  points: Point[]
): SVGElement {
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

  $target.append($polygon)

  return $polygon
}

/**
 * Creates a circle object and appends it to $target
 * The circle is defined by ist center Point and its radius
 *
 * @param $target - the element to which the new element is appended
 * @param object - the AngryBirds object this element represents
 * @param color - the fill color for the circle
 * @param center - the center {@link Point} of the circle
 * @param radius - the radius of the circle
 * @returns the newly created circle
 */
function drawCircle(
  $target: SVGElement,
  object: ABObject,
  color: string,
  center: Point,
  radius: number
): SVGElement {
  const $circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  )
  $circle.setAttribute("cx", String(center.x))
  $circle.setAttribute("cy", String(center.y))
  $circle.setAttribute("r", String(Math.abs(radius)))
  $circle.setAttribute("id", "svg-" + object.id)
  $circle.setAttribute(
    "style",
    `fill:${
      selectedObjects.includes(object) ? SELECTED_OBJECT_COLOR : color
    };stroke:${CIRCLE_STROKE_COLOR};stroke-width:0.5`
  )

  $target.append($circle)

  return $circle
}

/**
 * Rotates a list of points given as [x, y] by angle around center
 *
 * @param list - array of two-member-arrays: [[x1, x2], ...]
 * @param center - Point around which the points in the array are rotated
 * @param angle - angle by which the points are rotated
 *
 * @returns points in the same format as list, but rotated
 */
function rotShift(
  list: Array<[number, number]>,
  center: Point,
  angle: number
): Array<[number, number]> {
  return list.map(([x, y]) => {
    const xr = x * Math.cos(angle) - y * Math.sin(angle)
    const yr = x * Math.sin(angle) + y * Math.cos(angle)
    const xrs = xr + center.x
    const yrs = yr + center.y
    return [xrs, yrs]
  })
}

/**
 * Draws a shape for the given object to the given $target
 *
 * Objects of type "rect" are drawn as (appropriately rotated) rectangles
 * Objects of type "ball" or "unknown" are drawn as circle
 * Objects of type "poly" are drawn as poly shape
 *
 * @param object - AngryBirds Object that shall be displayed
 * @param $target - SVG Element to which the new svg element is added
 * @param clickEventListener - optional eventHandler for click events on the new svg element
 */
export function drawShape(
  object: ABObject,
  $target: SVGElement,
  clickEventListener?: (this: SVGElement, ev: MouseEvent) => any
): void {
  let newElement: SVGElement | undefined
  switch (object.shape) {
    case "rect": {
      const [w, h, angle] = object.params

      const halfHeight = Number(h) * 0.5
      const halfWidth = Number(w) * 0.5
      const points = rotShift(
        [
          [-halfHeight, -halfWidth],
          [-halfHeight, halfWidth],
          [halfHeight, halfWidth],
          [halfHeight, -halfWidth],
        ],
        { x: object.x, y: object.y },
        angle as number
      ).map(([x, y]: [number, number]) => ({ x, y }))
      newElement = drawPoly(
        $target,
        object,
        getColorFromMaterial(object.material) ?? FALLBACK_COLOR,
        points
      )
      break
    }

    case "ball":
      newElement = drawCircle(
        $target,
        object,
        getColorFromMaterial(object.material) ?? object.color ?? FALLBACK_COLOR,
        getCenterFromObjects([object]),
        (object.params[0] as number | undefined) ?? defaultRadius
      )
      break

    case "poly": {
      const [_, ...points] = object.params
      newElement = drawPoly(
        $target,
        object,
        getColorFromMaterial(object.material) ?? FALLBACK_COLOR,
        (points as Array<[number, number]>).map(([x, y]) => ({ x, y }))
      )
      break
    }

    case "unknown":
      console.log("draw unknown shape")
      newElement = drawCircle(
        $target,
        object,
        getColorFromMaterial(object.material) ?? FALLBACK_COLOR,
        getCenterFromObjects([object]),
        defaultRadius
      )
      break
    default:
      console.log("Not sure how to draw", object)
  }

  if (newElement && clickEventListener) {
    newElement.addEventListener("click", clickEventListener)
  }
}

/**
 * Snaps a single coordinate to the nearest point in the grid
 *
 * @param coordinate - coordinate before
 * @returns coordinate of the nearest point in the grid
 */
export function snapToGrid(coordinate: number): number {
  const rest = coordinate % gridSize
  if (rest < gridSize / 2) {
    return coordinate - rest
  }

  return coordinate + (gridSize - rest)
}

/**
 * Sets up selection rectangle
 *
 * Reuses existing rectangle iff available, else creates a new one.
 * Sets width and height to 1
 *
 * @param startPoint - the Point from which the rectangle starts
 * @returns
 */
export function initializeSelectionRectangle(startPoint: Point): SVGElement {
  const $selectionRectangle = getSelectionRectangle()
  $selectionRectangle.removeAttribute("hidden")
  $selectionRectangle.setAttribute("width", "1")
  $selectionRectangle.setAttribute("height", "1")
  $selectionRectangle.setAttribute("x", String(startPoint.x))
  $selectionRectangle.setAttribute("y", String(startPoint.y))
  $selectionRectangle.setAttribute(
    "style",
    "stroke-width:1;stroke:" + SELECTION_RECTANGLE_COLOR + ";fill-opacity:.1"
  )
  $svgElements.$groupOverlay.append($selectionRectangle)

  return $selectionRectangle
}

/**
 * Updates $selectionRectangle such that it spans from start point to end point,
 * where either of those is the upper left and the other is the lower right corner
 *
 * @param $selectionRectangle - the rectangle which shall be updated
 * @param start - on of the defining points
 * @param end - the other defining point
 */
export function updateSelectionRectangle(
  $selectionRectangle: SVGElement,
  start: Point,
  end: Point
): void {
  // Via https://stackoverflow.com/a/61221651
  $selectionRectangle.setAttribute("x", String(Math.min(start.x, end.x)))
  $selectionRectangle.setAttribute("y", String(Math.min(start.y, end.y)))
  $selectionRectangle.setAttribute("width", String(Math.abs(start.x - end.x)))
  $selectionRectangle.setAttribute("height", String(Math.abs(start.y - end.y)))
}

/**
 * Selects the selection Rectangle from the overlay group of the main svg canvas if
 * it exists already and creates a new rectangle otherwise
 *
 * @returns the rectangle
 */
function getSelectionRectangle(): SVGElement {
  const id = "selectionRectangle"
  const $existingRectangle =
    $svgElements.$groupOverlay.querySelector<SVGElement>("#" + id)
  if ($existingRectangle) {
    return $existingRectangle
  }

  const $newRectangle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "rect"
  )
  $newRectangle.setAttribute("id", id)
  $svgElements.$groupOverlay.append($newRectangle)

  return $newRectangle
}

/**
 * Hides the given SVG element
 *
 * @param $element - the element that shall be hidden
 */
export function hideElement($element: SVGElement | undefined): void {
  if (!$element) {
    return
  }

  $element.setAttribute("hidden", "true")
}

/**
 * Display a cross {@link drawCrossAt} at the center {@link getCenterFromObjects}
 * of the given objects
 *
 * @param objects - the objects at whose center the cross will be displayed
 */
export function showCenter(objects: ABObject[]): void {
  if (objects.length === 0) return

  if (objects.length === 1) {
    const [{ x, y }] = objects
    drawCrossAt({ x, y }, $svgElements.$groupOverlay)
    return
  }

  const { x, y } = getCenterFromObjects(objects)
  drawCrossAt({ x, y }, $svgElements.$groupOverlay)
}

/**
 * Draws a vertical and a horizontal line to $target such that those lines form
 * a cross over the given point
 *
 * @param center - center of the cross
 * @param $target - SVG element to which the cross is appended
 */
export function drawCrossAt({ x, y }: Point, $target: SVGElement): void {
  const crossSize = 20
  const style = "stroke:" + CENTER_CROSS_COLOR + ";stroke-width:2;opacity:.4"

  const $horizontalLine = getGenericLine(
    { x: x - crossSize, y },
    { x: x + crossSize, y },
    style
  )

  const $verticalLine = getGenericLine(
    { x, y: y + crossSize },
    { x, y: y - crossSize },
    style
  )

  const $group = document.createElementNS("http://www.w3.org/2000/svg", "g")
  $group.setAttribute("id", "svg-center")
  $group.append($horizontalLine, $verticalLine)

  $target.append($group)
}
