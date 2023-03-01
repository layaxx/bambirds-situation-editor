import { IRelationGenerator, RelationGenerator } from "./relationGenerator"

/** Basic Interval Algebra Relations */
enum IA {
  BEFORE,
  MEETS,
  OVERLAPS,
  STARTS,
  DURING,
  FINISHES,
  EQUAL,
}

export class IntervalAlgebraGenerator
  extends RelationGenerator
  implements IRelationGenerator
{
  name = "Interval Algebra"

  getRelation(sx: number, ex: number, sy: number, ey: number): IA | undefined {
    if (ex < sx || ey < sy) throw new Error("Invalid Input")

    if (this.equals(sx, sy) && this.equals(ex, ey)) return IA.EQUAL

    if (this.equals(ex, sy)) return IA.MEETS

    if (this.lT(ex, sy)) return IA.BEFORE

    if (this.equals(sx, sy) && this.lT(ex, ey)) return IA.STARTS

    if (this.gT(sx, sy) && this.lT(ex, ey)) return IA.DURING

    if (this.lT(sx, sy) && this.lT(sy, ex) && this.lT(ex, ey))
      return IA.OVERLAPS

    if (this.equals(ex, ey) && this.gT(sx, sy)) return IA.FINISHES

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
    return IA[relation].toLowerCase()
  }
}
