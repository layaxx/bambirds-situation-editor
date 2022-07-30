import { IObject, Point } from "../types"

export function getArea(object: IObject) {
  if (object.shape === "rect") {
    return (object.params[0] as number) * (object.params[1] as number)
  }

  if (object.shape === "ball") {
    return (object.params[0] as number) ** 2 * Math.PI
  }

  return object.area
}

export function scaleObjectInternal(object: IObject) {
  switch (object.shape) {
    case "rect":
      object.params[0] = (object.unscaledParams[0] as number) * object.scale
      object.params[1] = (object.unscaledParams[1] as number) * object.scale
      break
    case "ball":
      object.params[0] = (object.unscaledParams[0] as number) * object.scale
      break
    case "poly": {
      const [first, ...rest] = object.vectors

      object.params = [
        first,
        ...rest.map((input) => {
          if (typeof input === "number") return [1, 1]
          const [x, y] = input
          return [object.x + x * object.scale, object.y + y * object.scale]
        }),
      ]
      break
    }

    default:
      console.log("Not sure how to scale", object)
  }
}

export function handleMoveObject(
  object: IObject,
  key: string,
  isHighSpeed?: boolean
) {
  if (!object) {
    return
  }

  const offset = Number(isHighSpeed ? 10 : 1)
  let xOffset = 0
  let yOffset = 0
  switch (key) {
    case "ArrowUp":
      yOffset = -offset // Y = 0 is at the top
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
      console.log("Unknown moving direction:", key, "ignoring.")
      return
  }

  translatePolyObject(object, xOffset, yOffset)

  object.x += xOffset
  object.y += yOffset
}

export function translatePolyObject(
  object: IObject,
  xOffset: number,
  yOffset: number
) {
  if (object.shape === "poly") {
    const [first, ...rest] = object.unscaledParams
    object.unscaledParams = [
      first,
      ...rest.map((input) =>
        typeof input === "number"
          ? [input, input]
          : [input[0] + xOffset, input[1] + yOffset]
      ), // Y=0 is at top
    ]
    scaleObjectInternal(object) // Needed to translate unscaledParams to actual params
  }
}

export function handleScaleObject(
  object: IObject,
  key: string,
  isHighSpeed?: boolean
) {
  if (!object) {
    return
  }

  const offset = 0.1 * (isHighSpeed ? 10 : 1)

  switch (key) {
    case "ArrowUp":
      object.scale += offset
      scaleObjectInternal(object)
      break
    case "ArrowDown":
      object.scale -= offset
      scaleObjectInternal(object)
      break
    default:
      console.log("Unknown scaling direction:", key, "ignoring.")
  }
}

export function getObjectsWithinBoundary(
  objects: IObject[],
  upperLeft: Point,
  lowerRight: Point
) {
  // By center point, because easier
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
  let minX = Number.MAX_VALUE
  let maxX = 0
  let minY = Number.MAX_VALUE
  let maxY = 0

  for (const object of objects) {
    minX = Math.min(object.x, minX)
    maxX = Math.max(object.x, maxX)
    minY = Math.min(object.y, minY)
    maxY = Math.max(object.y, maxY)
  }

  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
}
