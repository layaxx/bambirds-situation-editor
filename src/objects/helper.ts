import { redrawObjects } from "../output"
import { IObject, Point } from "./types"

export function getArea(object: IObject) {
  if (object.shape === "rect") {
    return (object.params[0] as number) * (object.params[1] as number)
  }
  if (object.shape === "ball") {
    return Math.pow(object.params[0] as number, 2) * Math.PI
  }
  return object.area
}

export function getColorFromMaterial(
  material: string | undefined
): string | undefined {
  switch (material) {
    case "ice":
      return "#99B3FF"
    case "stone":
      return "#808080"
    case "wood":
      return "#E6991A"
    case "pork":
      return "#1AFF1A"
    case "tnt":
      return "#E6E600"
    default:
      return material
  }
}

export function _scaleObject(obj: IObject) {
  // TODO: does not work for poly shapes
  switch (obj.shape) {
    case "rect":
      obj.params[0] = (obj.unscaledParams[0] as number) * (obj.scale as number)
      obj.params[1] = (obj.unscaledParams[1] as number) * (obj.scale as number)
      break
    case "ball":
      obj.params[0] = (obj.unscaledParams[0] as number) * obj.scale
      break
    case "poly":
      function func(
        input: number | number[],
        scaleFactor: number
      ): number | number[] {
        if (typeof input === "number") {
          return (input *= scaleFactor)
        }
        return input.map((value) => (value *= scaleFactor))
      }
      const [first, ...rest] = obj.unscaledParams
      obj.params = [first, ...rest.map((value) => func(value, obj.scale))]
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

  redrawObjects([obj])
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

export function handleRotateObject(
  obj: IObject,
  key: string,
  isHighSpeed?: boolean
) {
  if (!obj) {
    return
  }

  const offset = 0.1 * (isHighSpeed ? 10 : 1)
  if (!obj.params || obj.params[2] === undefined) {
    console.error("Cannot rotate Object", obj)
    return
  }
  if (obj.shape === "poly") {
    console.error("Cannot rotate poly objects")
  }
  switch (key) {
    case "ArrowLeft":
      ;(obj.params[2] as number) -= offset
      break
    case "ArrowRight":
      ;(obj.params[2] as number) += offset
      break
    default:
      console.log("Unknown rotation direction: ", key, " ignoring.")
      return
  }

  redrawObjects([obj])
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

  redrawObjects([obj])
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
