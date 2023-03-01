import { ABObject } from "../objects/angryBirdsObject"

export interface IRelationGenerator {
  name: string
  getRelationX(a: ABObject, b: ABObject): string | undefined
  getRelationY(a: ABObject, b: ABObject): string | undefined
  getMiscRelation(a: ABObject, b: ABObject): string | undefined
  getRelationString(
    sx: number,
    ex: number,
    sy: number,
    ey: number
  ): string | undefined
}

export abstract class RelationGenerator implements IRelationGenerator {
  name = "abstract"

  // eslint-disable-next-line @typescript-eslint/class-literal-property-style
  private readonly _threshold = 2
  // eslint-disable-next-line @typescript-eslint/class-literal-property-style
  private readonly _divideBefore = false

  getRelationString(
    _sx: number,
    _ex: number,
    _sy: number,
    _ey: number
  ): string | undefined {
    throw new Error("Method not implemented.")
  }

  public getRelationX(a: ABObject, b: ABObject) {
    const relation = this.getRelationString(
      a.getMinX(),
      a.getMaxX(),
      b.getMinX(),
      b.getMaxX()
    )
    if (this._divideBefore && relation === "before") {
      throw new Error("Method not implemented.")
    }

    return relation
  }

  public getRelationY(a: ABObject, b: ABObject) {
    return this.getRelationString(
      a.getMinY(),
      a.getMaxY(),
      b.getMinY(),
      b.getMaxY()
    )
  }

  public getMiscRelation(_a: ABObject, _b: ABObject): string | undefined {
    return undefined
  }

  protected equals(a: number, b: number) {
    return Math.abs(a - b) < this._threshold
  }

  protected lT(a: number, b: number) {
    return !this.equals(a, b) && a < b
  }

  protected lE(a: number, b: number) {
    return this.equals(a, b) || a < b
  }

  protected gT(a: number, b: number) {
    return !this.equals(a, b) && a > b
  }

  protected gE(a: number, b: number) {
    return this.equals(a, b) || a > b
  }
}
