import { selectedObjects } from "../app"
import { IObject, Point } from "../types"

export function getArea(object: IObject) {
  if (object.shape === "rect") {
    return (object.params[0] as number) * (object.params[1] as number)
  }
  if (object.shape === "ball") {
    return Math.pow(object.params[0] as number, 2) * Math.PI
  }
  return object.area
}

export function _scaleObject(obj: IObject) {
  switch (obj.shape) {
    case "rect":
      obj.params[0] = (obj.unscaledParams[0] as number) * (obj.scale as number)
      obj.params[1] = (obj.unscaledParams[1] as number) * (obj.scale as number)
      break
    case "ball":
      obj.params[0] = (obj.unscaledParams[0] as number) * (obj.scale as number)
      break
    case "poly":
      const [first, ...rest] = obj.vectors

      obj.params = [
        first,
        ...rest.map((input) => {
          if (typeof input === "number") return [1, 1]
          const [x, y] = input
          return [obj.x + x * obj.scale, obj.y + y * obj.scale]
        }),
      ]
      break
    default:
      console.log("Not sure how to scale", obj)
  }
}

export function handleMoveObject(
  obj: IObject,
  key: string,
  isHighSpeed?: boolean
) {
  if (!obj) {
    return
  }

  const offset = 1 * (isHighSpeed ? 10 : 1)
  var xOffset = 0
  var yOffset = 0
  switch (key) {
    case "ArrowUp":
      yOffset = -offset // y = 0 is at the top
      break
    case "ArrowDown":
      yOffset = offset
      break
    case "ArrowLeft":
      xOffset = -offset
      break
    case "ArrowRight":
      xOffset = offset
      break
    default:
      console.log("Unknown moving direction: ", key, " ignoring.")
      return
  }

  translatePolyObject(obj, xOffset, yOffset)

  obj.x += xOffset
  obj.y += yOffset
}

export function translatePolyObject(
  obj: IObject,
  xOffset: number,
  yOffset: number
) {
  if (obj.shape === "poly") {
    // @ts-ignore
    const [first, ...rest]: [number, number[]] = obj.unscaledParams
    obj.unscaledParams = [
      first,
      ...rest.map(([x, y]) => [x + xOffset, y + yOffset]), // y=0 is at top
    ]
    _scaleObject(obj) // needed to translate unscaledParams to actual params
  }
}

export function handleScaleObject(
  obj: IObject,
  key: string,
  isHighSpeed?: boolean
) {
  if (!obj) {
    return
  }

  const offset = 0.1 * (isHighSpeed ? 10 : 1)

  switch (key) {
    case "ArrowUp":
      obj.scale += offset
      _scaleObject(obj)
      break
    case "ArrowDown":
      obj.scale -= offset
      _scaleObject(obj)
      break
    default:
      console.log("Unknown scaling direction: ", key, " ignoring.")
      return
  }
}

export function getObjectsWithinBoundary(
  objects: IObject[],
  upperLeft: Point,
  lowerRight: Point
) {
  // by center point, because easier
  const result: IObject[] = []

  for (const object of objects) {
    const isInBoundaryXAxis =
      upperLeft.x <= object.x && object.x <= lowerRight.x
    const isInBoundaryYAxis =
      upperLeft.y <= object.y && object.y <= lowerRight.y
    const isInBoundary = isInBoundaryXAxis && isInBoundaryYAxis
    if (isInBoundary) {
      result.push(object)
    }
  }

  return result
}

export function getCenterFromObjects(objects: IObject[]): Point {
  var minX = Number.MAX_VALUE
  var maxX = 0
  var minY = Number.MAX_VALUE
  var maxY = 0

  objects.forEach((object) => {
    minX = Math.min(object.x, minX)
    maxX = Math.max(object.x, maxX)
    minY = Math.min(object.y, minY)
    maxY = Math.max(object.y, maxY)
  })

  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
}
