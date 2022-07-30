export interface IObject {
  material: string
  id: string
  x: number
  y: number
  isPig?: boolean
  isBird?: boolean
  color?: string
  shape: string
  form: string
  area: number
  scale: number
  params: (number | number[])[]
  unscaledParams: (number | number[])[]
  vectors: [number, ...[number, number][]]
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
