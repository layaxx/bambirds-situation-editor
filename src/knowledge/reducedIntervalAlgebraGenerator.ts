import { IRelationGenerator, RelationGenerator } from "./relationGenerator"

/** Reduced Interval Algebra Relations */
enum RIA {
  BEFORE,
  OVERLAPS_MOST,
  TOUCHES,
  EQUAL,
}

export class ReducedIntervalAlgebraGenerator
  extends RelationGenerator
  implements IRelationGenerator
{
  name = "Reduced Interval Algebra"

  getRelation(sx: number, ex: number, sy: number, ey: number): RIA | undefined {
    if (ex < sx || ey < sy) throw new Error("Invalid Input")
    const cy = (sy + ey) / 2

    if (this.equals(sx, sy) && this.equals(ex, ey)) return RIA.EQUAL

    if (this.lT(ex, sy)) return RIA.BEFORE

    if (
      this.lT(sx, sy) &&
      this.lT(sy, ex) &&
      this.lT(ex, ey) &&
      this.gT(ex, cy)
    )
      return RIA.OVERLAPS_MOST

    if (this.lE(ex, cy) && this.gE(ex, sy)) return RIA.TOUCHES

    return undefined
  }

  getRelationString(
    sx: number,
    ex: number,
    sy: number,
    ey: number
  ): string | undefined {
    const relation = this.getRelation(sx, ex, sy, ey)

    if (relation === undefined) return relation
    return RIA[relation].toLowerCase()
  }
}
