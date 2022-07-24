import { selectedObject } from "../app"
import { redrawObjects } from "../output"
import { IObject } from "./data"

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

export function handleMoveObject(key: string, isHighSpeed?: boolean) {
  if (!selectedObject) {
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

  translatePolyObject(selectedObject, xOffset, yOffset)

  selectedObject.x += xOffset
  selectedObject.y += yOffset

  redrawObjects(selectedObject)
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

export function handleRotateObject(key: string, isHighSpeed?: boolean) {
  if (!selectedObject) {
    return
  }

  const offset = 0.1 * (isHighSpeed ? 10 : 1)
  if (!selectedObject.params || selectedObject.params[2] === undefined) {
    console.error("Cannot rotate Object", selectedObject)
    return
  }
  if (selectedObject.shape === "poly") {
    console.error("Cannot rotate poly objects")
  }
  switch (key) {
    case "ArrowLeft":
      ;(selectedObject.params[2] as number) -= offset
      break
    case "ArrowRight":
      ;(selectedObject.params[2] as number) += offset
      break
    default:
      console.log("Unknown rotation direction: ", key, " ignoring.")
      return
  }

  redrawObjects(selectedObject)
}

export function handleScaleObject(key: string, isHighSpeed?: boolean) {
  if (!selectedObject) {
    return
  }

  const offset = 0.1 * (isHighSpeed ? 10 : 1)

  switch (key) {
    case "ArrowUp":
      selectedObject.scale += offset
      _scaleObject(selectedObject)
      break
    case "ArrowDown":
      selectedObject.scale -= offset
      _scaleObject(selectedObject)
      break
    default:
      console.log("Unknown scaling direction: ", key, " ignoring.")
      return
  }

  redrawObjects(selectedObject)
}
