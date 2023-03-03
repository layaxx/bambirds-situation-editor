/* eslint-disable unicorn/filename-case */
import { ABObject } from "../objects/angryBirdsObject"
import { IRelationGenerator, RelationGenerator } from "./relationGenerator"

export const directions = [
  "right",
  "right_top",
  "top",
  "top",
  "left_top",
  "left",
  "left",
  "left_bottom",
  "bottom",
  "bottom",
  "right_bottom",
  "right",
] as const

export const distances = [
  "at",
  "very_close",
  "close",
  "medium",
  "far",
  "very_far",
  "farthest",
] as const

export class EOPRAGenerator
  extends RelationGenerator
  implements IRelationGenerator
{
  name = "EOPRA"

  getRelationString(
    _sx: number,
    _ex: number,
    _sy: number,
    _ey: number
  ): undefined {
    return undefined
  }

  getMiscRelation(a: ABObject, b: ABObject): string {
    let direction = "_"
    try {
      direction = this.getDirection(a, b)
    } catch {}

    let distance = "_"
    try {
      distance = this.getDistance(a, b)
    } catch {}

    return `EOPRA(${a.id}, ${b.id}, ${direction}, ${distance}`
  }

  getDistance(a: ABObject, b: ABObject) {
    const { x: ax, y: ay } = a.getCenter()
    const { x: bx, y: by } = b.getCenter()
    const distance = Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)

    const index = Math.min(
      Math.floor(distance / (350 / 12)),
      distances.length - 1
    )

    return distances[index]
  }

  getDirection(a: ABObject, b: ABObject) {
    const { x: ax, y: ay } = a.getCenter()
    const { x: bx, y: by } = b.getCenter()
    const index = Math.floor(
      (Math.atan2(by - ay, bx - ax) + Math.PI) / (Math.PI / 6)
    )

    return directions[index]
  }
}
