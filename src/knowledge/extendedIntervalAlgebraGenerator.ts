import { IRelationGenerator, RelationGenerator } from "./relationGenerator"

/** Extended Interval Algebra Relations */
enum EIA {
  BEFORE,
  MEETS,
  MOST_OVERLAPS_MOST,
  LESS_OVERLAPS_LESS,
  MOST_OVERLAPS_LESS,
  LESS_OVERLAPS_MOST,
  STARTS_COVERS_MOST,
  STARTS_COVERS_LESS,
  DURING_LEFT,
  DURING_RIGHT,
  DURING_CENTER,
  FINISHES_MOST,
  FINISHES_LESS,
  EQUAL,
}
export class ExtendedIntervalAlgebraGenerator
  extends RelationGenerator
  implements IRelationGenerator
{
  name = "Extended Interval Algebra"

  // eslint-disable-next-line complexity
  getRelation(sx: number, ex: number, sy: number, ey: number): EIA | undefined {
    if (ex < sx || ey < sy) throw new Error("Invalid Input")

    const cx = (sx + ex) / 2
    const cy = (sy + ey) / 2

    if (this.equals(sx, sy) && this.equals(ex, ey)) return EIA.EQUAL

    if (this.equals(ex, sy)) return EIA.MEETS

    if (this.lT(ex, sy)) return EIA.BEFORE

    if (this.gT(sx, sy) && this.lE(ex, cy)) return EIA.DURING_LEFT

    if (
      this.gT(sx, sy) &&
      this.lT(sx, cy) &&
      this.gT(ex, cy) &&
      this.lT(ex, ey)
    )
      return EIA.DURING_CENTER

    if (this.gE(sx, cy) && this.lT(ex, ey)) return EIA.DURING_RIGHT

    if (
      this.lT(sx, sy) &&
      this.gE(cx, sy) &&
      this.gE(ex, cy) &&
      this.lT(ex, ey)
    )
      return EIA.MOST_OVERLAPS_MOST

    if (this.lT(sx, sy) && this.gE(cx, sy) && this.lT(ex, cy))
      return EIA.MOST_OVERLAPS_LESS

    if (this.lT(cx, sy) && this.gE(ex, cy) && this.lT(ex, ey))
      return EIA.LESS_OVERLAPS_MOST

    if (this.lT(cx, sy) && this.gT(ex, sy) && this.lT(ex, cy))
      return EIA.LESS_OVERLAPS_LESS

    if (this.equals(sx, sy) && this.gE(ex, cy) && this.lT(ex, ey))
      return EIA.STARTS_COVERS_MOST

    if (this.equals(sx, sy) && this.gT(ex, sy) && this.lT(ex, cy))
      return EIA.STARTS_COVERS_LESS

    if (this.gT(sx, sy) && this.lE(sx, cy) && this.equals(ex, ey))
      return EIA.FINISHES_MOST

    if (this.gT(sx, cy) && this.lT(sx, ey) && this.equals(ex, ey))
      return EIA.FINISHES_LESS

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
    return EIA[relation].toLowerCase()
  }
}
