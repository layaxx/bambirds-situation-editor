import { Point } from "../types"
import { ABObject } from "./angryBirdsObject"

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
  objects: ABObject[],
  upperLeft: Point,
  lowerRight: Point
): ABObject[] {
  // By center point, because easier
  const result: ABObject[] = []

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
export function getCenterFromObjects(objects: ABObject[]): Point {
  let sumX = 0
  let sumY = 0

  for (const object of objects) {
    sumX += object.x
    sumY += object.y
  }

  return { x: sumX / objects.length, y: sumY / objects.length }
}

/**
 * Returns the vector between to points/vectors
 *
 * @example
 * ```
 * getVectorBetween({ x: 5, y: 6 }, { x: 0, y: 0 }) // returns { x: 5, y: 6 }
 *
 * getVectorBetween({ x: 0, y: 0 }, { x: 5, y: 6 }) // returns { x: -5, y: -6 }
 * ```
 *
 * @param point1 - the first point/vector
 * @param point2 - the second point/vector
 *
 * @returns a vector, such that if it is added to point2, the result will be point1
 */
export function getVectorBetween(point1: Point, point2: Point): Point {
  return { x: point1.x - point2.x, y: point1.y - point2.y }
}

/**
 * Scales a vector by a given factor.
 *
 * Scaling is achieved by multiplying each component of the vector with the factor
 *
 * @param vector - the vector to be scaled
 * @param factor - the factor
 *
 * @returns - a new, scaled vector
 */
export function scaleVector({ x, y }: Point, factor: number): Point {
  return { x: x * factor, y: y * factor }
}

/**
 * Adds two vectors/points
 *
 * @param vector1 - first vector to be added
 * @param vector2 - second vector to be added
 *
 * @returns returns a new vector that is the sum of both given vectors
 */
export function addVectors(vector1: Point, vector2: Point): Point {
  return { x: vector1.x + vector2.x, y: vector1.y + vector2.y }
}

/**
 * Helper function that rotates a given vector by a given angle.
 *
 * The angle is given in radians
 * @example
 * One full rotation:
 * ```
 * rotateVector(vector1, Math.PI * 2)
 * ```
 * However, note that due to floating point arithmetic,
 * ```
 * vector1 === rotateVector(vector1, Math.PI * 2)
 * ```
 * may be false
 *
 * @param vector - vector that shall be rotated
 * @param angle - angle of rotation (in radians)
 *
 * @returns - a new, rotated vector
 */
export function rotateVector(vector: Point, angle: number): Point {
  return {
    x: Math.cos(angle) * vector.x - Math.sin(angle) * vector.y,
    y: Math.sin(angle) * vector.x + Math.cos(angle) * vector.y,
  }
}
