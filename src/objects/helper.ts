import { IObject, Point } from "../types"

/**
 * Calculates the area of a given object.
 *
 * TODO: currently only works for shapes "rect" and "ball" but not for "poly"
 *
 * Area of a rectangle is determined as width * height
 *
 * Area of a ball (i.e. circle) is determined as radius squared * PI
 *
 * @param object - object whose area is to be calculated
 *
 * @returns the area of the given object
 */
export function getArea(object: IObject): number {
  if (object.shape === "rect") {
    return (object.params[0] as number) * (object.params[1] as number)
  }

  if (object.shape === "ball") {
    return (object.params[0] as number) ** 2 * Math.PI
  }

  return object.area
}

/**
 * Helper function that ensures a given objects params match its internal state,
 * i.e. the params are equal to the unscaledParams scaled by the objects scaleFactor
 *
 * @param object - object whose scale shall be ensured to be correctly represented
 */
export function scaleObjectInternal(object: IObject): void {
  switch (object.shape) {
    case "rect":
      object.params[0] = (object.unscaledParams[0] as number) * object.scale
      object.params[1] = (object.unscaledParams[1] as number) * object.scale
      break
    case "ball":
      object.params[0] = (object.unscaledParams[0] as number) * object.scale
      break
    case "poly": {
      const [first, ...rest] = object.vectors ?? [-1]

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

/**
 * Handles the movement of a given object considering the given key presses.
 *
 * Valid keys are the arrow keys, which correspond to the appropriate movement of the object,
 * i.e. "ArrowUp" moves the object up, etc.
 *
 * Objects are moved 1 or 10 pixels in the appropriate direction, depending on the truthiness
 * of isHighSpeed
 *
 * @param object - object that shall be moved
 * @param key - key corresponding to the direction in which the object is moved
 * @param isHighSpeed - increases movement speed tenfold iff true
 */
export function handleMoveObject(
  object: IObject,
  key: string,
  isHighSpeed?: boolean
): void {
  const offset = isHighSpeed ? 10 : 1
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

  object.x += xOffset
  object.y += yOffset

  if (object.shape === "poly") translatePolyObject(object, xOffset, yOffset)
}

/**
 * Translates a poly objects params by a given offset.
 *
 * Can be used to ensure a poly objects params match with its center coordinates.
 *
 * Has no effect on non poly objects
 *
 * @param object - object that shall be translated
 * @param xOffset - offset in x direction in which the object is translated
 * @param yOffset - offset in y direction in which the object is translated. Remember y = 0 is at the top
 */
export function translatePolyObject(
  object: IObject,
  xOffset: number,
  yOffset: number
): void {
  if (object.shape === "poly") {
    object.unscaledParams = object.unscaledParams.map((value, index) => {
      if (index === 0) {
        return value
      }

      if (typeof value === "number") {
        // This should actually never happen and is just a fallback
        return [value, value]
      }

      const [x, y] = value
      return [x + xOffset, y + yOffset]
    })

    scaleObjectInternal(object) // Needed to translate unscaledParams to actual params
  }
}

/**
 * Handles the Scaling of a given object considering the given key presses.
 *
 * Valid keys are the "ArrowUp" and "ArrowDown" keys,
 * which correspond an appropriate change in scaling of the object,
 * i.e. "ArrowUp" scales the object up, etc.
 *
 * Objects scale is increased/decreased by 1 or 0.1 depending on the truthiness of isHighSpeed
 *
 * @param object - object that shall be scaled
 * @param key - key corresponding to whether scale shall be increased or decreased
 * @param isHighSpeed - increases scaling offset tenfold iff true
 */
export function handleScaleObject(
  object: IObject,
  key: string,
  isHighSpeed?: boolean
): void {
  const offset = isHighSpeed ? 1 : 0.1

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

/**
 * Returns an array of objects from given objects whose center is between the rectangle
 * defined by the given points.
 *
 * @param objects - array of objects that shall be considered
 * @param upperLeft - upper left corner of the boundary
 * @param lowerRight - lower right corner of the boundary
 *
 * @returns array of objects whose center is inside the boundary
 */
export function getObjectsWithinBoundary(
  objects: IObject[],
  upperLeft: Point,
  lowerRight: Point
): IObject[] {
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

/**
 * Calculates the center of an array of objects by calculating the average of their
 * centers x and y coordinates
 *
 * @param objects - array of objects whose center shall be calculated
 *
 * @returns point representing the average of the objects centers
 */
export function getCenterFromObjects(objects: IObject[]): Point {
  let sumX = 0
  let sumY = 0

  for (const object of objects) {
    sumX += object.x
    sumY += object.y
  }

  return { x: sumX / objects.length, y: sumY / objects.length }
}
