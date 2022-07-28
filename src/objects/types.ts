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
}

export type Point = {
  x: number
  y: number
}
