import { ABObject } from "../objects/angryBirdsObject"
import { Point, Scene } from "../types"

type LevelObject = {
  angle: number
  id: string
  x: number
  y: number
}

type Level = {
  camera: unknown
  counts: { birds: number; blocks: number }
  id: string
  scoreEagle?: number
  scoreGold?: number
  scoreSilver?: number
  theme: string
  world: Record<string, LevelObject>
}

export default function parseLevel(level: Level): {
  objects: ABObject[]
  scene: Scene
} {
  const objects: ABObject[] = []

  console.info("Loading Level", level.id)

  for (const id of Object.keys(level.world)) {
    const { x, y, angle, id: type } = level.world[id]

    objects.push(
      new ABObject(
        translateCoordinates({ x, y }),
        angle * (Math.PI / 180),
        type,
        id
      )
    )
  }

  return {
    objects,
    scene: {
      groundY: 400,
      derivedPredicates: [],
      commonPredicates: [],
    },
  }
}

export function parseType(type: string): {
  shape: string
  params: Array<number | number[]>
  area: number
  material?: string
  color?: string
  form?: string
  isBird?: boolean
  isPig?: boolean
} {
  let shape = "rect"
  let form = undefined
  let area = 0
  let material = undefined
  let params: Array<number | number[]> = []
  let isBird = false
  let isPig = false
  let color = undefined

  if (type.startsWith("BIRD")) {
    isBird = true
    shape = "ball"
    color = type.replace("BIRD_", "").toLowerCase()
    params = [5]
  }

  if (type.startsWith("PIG")) {
    isPig = true
    shape = "ball"
    material = "pork"
    if (type.includes("SMALL")) {
      params = [6]
    } else if (type.includes("MEDIUM")) {
      params = [9]
    } else {
      params = [12]
    }
  }

  if (type.includes("_BLOCK_")) {
    material = type.split("_")[0].toLowerCase()
    const dim = type.match(/.*_BLOCK_(\d+)X(\d+)/)
    params = [(Number(dim?.[2]) ?? 4) * 5, (Number(dim?.[1]) ?? 4) * 5, 0]
  }

  if (type.includes("_CIRCLE_")) {
    shape = "ball"
    material = type.split("_")[0].toLowerCase()
    const dim = type.match(/.*_CIRCLE_(\d+)X\d+/)
    params = [(Number(dim?.[1]) ?? 4) * 2.5, 0]
  }

  if (type.includes("TERRAIN_TEXTURED_HILLS")) {
    color = "black"
    material = undefined
    const dim = type.match(/TERRAIN_TEXTURED_HILLS_(\d+)X(\d+)/)
    params = [(Number(dim?.[2]) ?? 4) * 5, (Number(dim?.[1]) ?? 4) * 5, 0]
  }

  return { shape, params, area, material, form, isBird, isPig, color }
}

function scale(
  number: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
) {
  return ((number - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
}

function translateCoordinates({ x, y }: Point): Point {
  return {
    x: scale(x, 0, 110, 130, 700),
    y: 400 + scale(y, 0, 20, 0, 100),
  }
}
