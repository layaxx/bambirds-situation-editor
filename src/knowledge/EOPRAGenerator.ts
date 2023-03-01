/* eslint-disable unicorn/filename-case */
import { ABObject } from "../objects/angryBirdsObject"
import { IRelationGenerator, RelationGenerator } from "./relationGenerator"

const directions = [
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
]

const distances = [
  "at",
  "very_close",
  "close",
  "medium",
  "far",
  "very_far",
  "farthest",
]

export class EOPRAGenerator
  extends RelationGenerator
  implements IRelationGenerator
{
  name = "EOPRA"

  getRelationString(sx: number, ex: number, sy: number, ey: number): undefined {
    return undefined
  }

  getMiscRelation(a: ABObject, b: ABObject): string {
    let direction = "_"
    try {
      direction = this._getDirection(a, b)
    } catch {}

    let distance = "_"
    try {
      distance = this._getDistance(a, b)
    } catch {}

    return `EOPRA(${a.id}, ${b.id}, ${direction}, ${distance}`
  }

  private _getDistance(a: ABObject, b: ABObject) {
    const { x: ax, y: ay } = a.getCenter()
    const { x: bx, y: by } = b.getCenter()
    const distance = Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)

    const index = Math.min(
      Math.floor(distance / (350 / 12)),
      distances.length - 1
    )

    return distances[index]
  }

  private _getDirection(a: ABObject, b: ABObject) {
    const { x: ax, y: ay } = a.getCenter()
    const { x: bx, y: by } = b.getCenter()
    const index = Math.floor(
      (Math.atan2(by - ay, bx - ax) + Math.PI) / (Math.PI / 6)
    )

    return directions[index]
  }
}
