import {
  getFormFor,
  getMaterialFor,
  parseShapePredicate,
} from "../parser/situationFileParser"
import { IFormPredicate, IMaterialPredicate, Point } from "../types"
import { getVectorBetween } from "./helper"

export class ABObject {
  material: string
  id: string
  x: number
  y: number
  isPig = false
  isBird = false
  color?: string
  shape: string
  form?: string
  area: number
  scale: number
  params: Array<number | number[]>
  private readonly _unscaledParams: Array<number | number[]>
  private _vectors?: [number, ...Array<[number, number]>]

  public constructor(object: ABObject, id: string)
  public constructor(
    shapePredicate: string,
    parsedMaterialPredicates: IMaterialPredicate[],
    parsedFormPredicates: IFormPredicate[]
  )
  public constructor(
    ...args:
      | [ABObject, string]
      | [string, IMaterialPredicate[], IFormPredicate[]]
  ) {
    if (args.length === 2) {
      const [object, id] = args
      this.id = id
      this.x = object.x
      this.y = object.y
      this.shape = object.shape
      this.params = JSON.parse(JSON.stringify(object.params)) as Array<
        number | number[]
      >
      this.area = object.area
      this.material = object.material
      this.form = object.form
      this.scale = object.scale
      this._unscaledParams = JSON.parse(
        JSON.stringify(object._unscaledParams)
      ) as Array<number | number[]>
      this._vectors =
        object._vectors === undefined
          ? undefined
          : (JSON.parse(JSON.stringify(object._vectors)) as
              | [number, ...Array<[number, number]>]
              | undefined)
    } else if (args.length === 3) {
      const [shapePredicate, parsedMaterialPredicates, parsedFormPredicates] =
        args
      let parsedObject
      try {
        parsedObject = parseShapePredicate(shapePredicate)
      } catch {}

      if (!parsedObject) {
        throw new Error("Failed to parse shape predicate " + shapePredicate)
      }

      const { id, x, y, shape, area, params } = parsedObject
      this.id = id
      this.x = x
      this.y = y
      this.shape = shape
      this.params = params
      this.area = area

      this.material =
        getMaterialFor(id, parsedMaterialPredicates) ?? "unknown material"
      this.form = getFormFor(id, parsedFormPredicates)

      this.scale = 1
      this._unscaledParams = JSON.parse(JSON.stringify(params)) as Array<
        number | number[]
      >
      this._vectors =
        shape === "poly"
          ? (params.map((entry, index) => {
              if (index === 0 || typeof entry === "number") return entry
              const [x1, y1] = entry
              const newX: number = x1 - x
              const newY: number = y1 - y
              return [newX, newY]
            }) as [number, ...Array<[number, number]>])
          : undefined
    } else {
      throw new Error("Invalid constructor call", args)
    }
  }

  moveBy(vector: Point) {
    this.x += vector.x
    this.y += vector.y

    if (this.shape === "poly") {
      this._ensureParamsMatch()
    }
  }

  moveTo(point: Point) {
    const vector = getVectorBetween(point, this)
    this.moveBy(vector)
  }

  /**
   * Calculates the area of a given object.
   *
   * TODO: currently only works for shapes "rect" and "ball" but not for "poly"
   *
   * Area of a rectangle is determined as width * height
   *
   * Area of a ball (i.e. circle) is determined as radius squared * PI
   *
   * @returns the area of the given object
   */
  getArea(): number {
    if (this.shape === "rect") {
      return (this.params[0] as number) * (this.params[1] as number)
    }

    if (this.shape === "ball") {
      return (this.params[0] as number) ** 2 * Math.PI
    }

    return this.area
  }

  clone(id: string): ABObject {
    return new ABObject(this, id)
  }

  /**
   * Helper function to quickly convert an IObject to a Point representing its center
   *
   * @returns the center of the object as Point
   */
  getCenter(): Point {
    return { x: this.x, y: this.y }
  }

  /**
   * Helper function that ensures a given objects params match its internal state,
   * i.e. the params are equal to the unscaledParams scaled by the objects scaleFactor
   */
  setScale(newScale: number): void {
    this.scale = newScale
    switch (this.shape) {
      case "rect":
        this.params[0] = (this._unscaledParams[0] as number) * this.scale
        this.params[1] = (this._unscaledParams[1] as number) * this.scale
        break
      case "ball":
        this.params[0] = (this._unscaledParams[0] as number) * this.scale
        break
      case "poly": {
        this._ensureParamsMatch()
        break
      }

      default:
        console.log("Not sure how to scale", this)
    }
  }

  /**
   * Rotates this object by a given angle.
   *
   * Angle is in radians, s.t. one full rotation is achieved for `angle = Math.PI *2`
   *
   * Direction of rotation is click-wise for positive values of `angle`
   *
   * Note that the given angle is applied in addition to any potential previous rotation.
   * I.e. if an `object` has already been rotated by `Math.PI` and `object.rotateBy(Math.PI)` is called,
   * the object is rotated by 180° again, for a total rotation of 360°
   *
   * @param angle - the angle of rotation in radians
   */
  rotateBy(angle: number): void {
    if (this.shape === "poly") {
      const [first, ...rest] = this._vectors ?? [-1]
      this._vectors = [
        first,
        ...rest.map((input): [number, number] => {
          if (typeof input === "number") {
            return [1, 1]
          }

          const [x1, y1] = input
          const newX = Math.cos(angle) * x1 - Math.sin(angle) * y1
          const newY = Math.sin(angle) * x1 + Math.cos(angle) * y1

          return [newX, newY]
        }),
      ]
      this._ensureParamsMatch()
    } else if (this.shape === "ball") {
      // Dont need to rotate balls
    } else if (!this.params || this.params[2] === undefined) {
      console.error("Cannot rotate invalid object", this)
    } else {
      ;(this.params[2] as number) += angle
    }
  }

  private _ensureParamsMatch() {
    if (this.shape === "poly") {
      const [first, ...rest] = this._vectors ?? [-1]

      this.params = [
        first,
        ...rest.map((input) => {
          if (typeof input === "number") return [1, 1]
          const [x, y] = input
          return [this.x + x * this.scale, this.y + y * this.scale]
        }),
      ]
    }
  }
}
