import { ABObject } from "./objects/angryBirdsObject"

export type Point = {
  x: number
  y: number
}

export type SelectionMeta = {
  scale: number
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
  objects: ABObject[]
  shootAt: Point
}

export type Transformation = {
  deltaX: number
  deltaY: number
  scale: number
}
