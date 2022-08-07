import { Point } from "../types"

export class Transformation {
  constructor(
    readonly vector: Point,
    readonly center: Point,
    readonly scale: number
  ) {
    this.vector = vector
    this.center = center
    this.scale = scale
  }
}
