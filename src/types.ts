export interface IObject {
  material: string
  id: string
  x: number
  y: number
  isPig?: boolean
  isBird?: boolean
  color?: string
  shape: string
  form?: string
  area: number
  scale: number
  params: Array<number | number[]>
  unscaledParams: Array<number | number[]>
  vectors?: [number, ...Array<[number, number]>]
}

export type Point = {
  x: number
  y: number
}

export type SelectionMeta = {
  scale: number
  angle: number
  origins: Point[]
  vectors: Point[]
  center: Point
}

export type TableElements = {
  id: HTMLElement
  x: HTMLInputElement
  y: HTMLInputElement
  s: HTMLInputElement
  a: HTMLInputElement
}

export type SVGElements = {
  $svg: HTMLElement
  $groupBackground: SVGElement
  $groupObjects: SVGElement
  $groupOverlay: SVGElement
}

export type Scene = {
  groundY: number
  derivedPredicates: string[]
  commonPredicates: string[]
}

export interface IFormPredicate {
  id: string
  form: string
}

export interface IMaterialPredicate {
  id: string
  material: string
}

export type Case = {
  id: number
  objects: IObject[]
  shootAt: Point
}

export type Transformation = {
  deltaX: number
  deltaY: number
  scale: number
}
