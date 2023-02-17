import { drawCircle, drawPoly } from "../output/svg"
import { parseType } from "../parser/levelParser"
import {
  getFormFor,
  getMaterialFor,
  parseShapePredicate,
} from "../parser/situationFileParser"
import { IFormPredicate, IMaterialPredicate, Point } from "../types"
import {
  FALLBACK_COLOR,
  getColorFromMaterial,
  SELECTED_OBJECT_COLOR,
} from "./colors"
import { deepCopy, getVectorBetween, rotShift } from "./helper"

export class ABObject {
  id: string
  x: number
  y: number
  isPig = false
  isBird = false
  shape: string
  color?: string
  material?: string
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
    center: Point,
    angle: number,
    type: string,
    objectID: string
  )
  public constructor(
    ...args:
      | [ABObject, string]
      | [string, IMaterialPredicate[], IFormPredicate[]]
      | [Point, number, string, string]
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

      this.material = getMaterialFor(id, parsedMaterialPredicates)
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
    } else if (args.length === 4) {
      const [{ x, y }, angle, type, objectID] = args

      this.id = objectID
      this.x = x
      this.y = y

      const { shape, params, area, material, form, color, isBird, isPig } =
        parseType(type)
      this.shape = shape
      this.params = params
      this.area = area
      this.material = material
      this.form = form
      this.color = color

      if (shape === "rect" && this.params.length === 3) {
        this.params[2] = angle
      }

      if (isBird) this.isBird = true
      if (isPig) this.isPig = true

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

  clone(id: string): this {
    const copy = deepCopy(this)
    copy.id = id
    return copy
  }

  /**
   * Helper function to quickly convert an IObject to a Point representing its center
   *
   * @returns the center of the object as Point
   */
  getCenter(): Point {
    return { x: this.x, y: this.y }
  }

  getWidth(): number {
    if (this.shape === "rect") {
      const [w, h, angle] = this.params

      const halfHeight = Number(h) * 0.5
      const halfWidth = Number(w) * 0.5
      const points = rotShift(
        [
          [-halfHeight, -halfWidth],
          [-halfHeight, halfWidth],
          [halfHeight, halfWidth],
          [halfHeight, -halfWidth],
        ],
        { x: this.x, y: this.y },
        angle as number
      ).map(([x, y]: [number, number]) => ({ x, y }))

      // eslint-disable-next-line unicorn/no-array-reduce
      const { minX, maxX } = points.reduce(
        (previous, curr) => ({
          minX: Math.min(previous.minX, curr.x),
          maxX: Math.max(previous.maxX, curr.x),
        }),
        { minX: Number.MAX_VALUE, maxX: Number.MIN_VALUE }
      )
      return maxX - minX
    }

    if (this.shape === "ball") {
      return (this.params[0] as number | undefined) ?? 100
    }

    console.error("Cannot handle Poly Objects atm")
    return 0
  }

  getHeight(): number {
    if (this.shape === "rect") {
      const [w, h, angle] = this.params

      const halfHeight = Number(h) * 0.5
      const halfWidth = Number(w) * 0.5
      const points = rotShift(
        [
          [-halfHeight, -halfWidth],
          [-halfHeight, halfWidth],
          [halfHeight, halfWidth],
          [halfHeight, -halfWidth],
        ],
        { x: this.x, y: this.y },
        angle as number
      ).map(([x, y]: [number, number]) => ({ x, y }))

      // eslint-disable-next-line unicorn/no-array-reduce
      const { minY, maxY } = points.reduce(
        (previous, curr) => ({
          minY: Math.min(previous.minY, curr.y),
          maxY: Math.max(previous.maxY, curr.y),
        }),
        { minY: Number.MAX_VALUE, maxY: Number.MIN_VALUE }
      )
      return maxY - minY
    }

    if (this.shape === "ball") {
      return (this.params[0] as number | undefined) ?? 100
    }

    console.error("Cannot handle Poly Objects atm")
    return 0
  }

  getLeftBound(): number {
    return this.x - this.getWidth() / 2
  }

  getRightBound(): number {
    return this.x + this.getWidth() / 2
  }

  getUpperBound(): number {
    return this.y - this.getHeight() / 2
  }

  getLowerBound(): number {
    return this.y + this.getHeight() / 2
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

  /**
   * Draws a shape for the given object to the given $target
   *
   * Objects of type "rect" are drawn as (appropriately rotated) rectangles
   * Objects of type "ball" or "unknown" are drawn as circle
   * Objects of type "poly" are drawn as poly shape
   *
   * @param $target - SVG Element to which the new svg element is added
   * @param isSelected - optional boolean indicating whether the highlight color should be used
   * @param clickEventListener - optional eventHandler for click events on the new svg element
   */
  render(
    $target: SVGElement,
    isSelected?: boolean,
    clickEventListener?: (this: SVGElement, ev: MouseEvent) => any
  ): void {
    /** Fallback radius to be used when radius for circle is undefined/unknown */
    const defaultRadius = 100

    let newElement: SVGElement | undefined
    switch (this.shape) {
      case "rect": {
        const [w, h, angle] = this.params

        const halfHeight = Number(h) * 0.5
        const halfWidth = Number(w) * 0.5
        const points = rotShift(
          [
            [-halfHeight, -halfWidth],
            [-halfHeight, halfWidth],
            [halfHeight, halfWidth],
            [halfHeight, -halfWidth],
          ],
          { x: this.x, y: this.y },
          angle as number
        ).map(([x, y]: [number, number]) => ({ x, y }))
        newElement = drawPoly(
          $target,
          points,
          isSelected
            ? SELECTED_OBJECT_COLOR
            : getColorFromMaterial(this.material) ??
                this.color ??
                FALLBACK_COLOR,
          this.id
        )
        break
      }

      case "ball":
        newElement = drawCircle(
          $target,
          this.getCenter(),
          (this.params[0] as number | undefined) ?? defaultRadius,
          isSelected
            ? SELECTED_OBJECT_COLOR
            : getColorFromMaterial(this.material) ??
                this.color ??
                FALLBACK_COLOR,
          this.id
        )
        break

      case "poly": {
        const [_, ...points] = this.params
        newElement = drawPoly(
          $target,
          (points as Array<[number, number]>).map(([x, y]) => ({ x, y })),
          isSelected
            ? SELECTED_OBJECT_COLOR
            : getColorFromMaterial(this.material) ?? FALLBACK_COLOR,
          this.id
        )
        break
      }

      case "unknown":
        console.log("draw unknown shape")
        newElement = drawCircle(
          $target,
          this.getCenter(),
          defaultRadius,
          isSelected
            ? SELECTED_OBJECT_COLOR
            : getColorFromMaterial(this.material) ?? FALLBACK_COLOR,
          this.id
        )
        break
      default:
        console.log("Not sure how to draw", this)
    }

    if (newElement && clickEventListener) {
      newElement.addEventListener("click", clickEventListener)
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
