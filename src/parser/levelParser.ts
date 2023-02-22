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
    try {
      const newObject = new ABObject(
        translateCoordinates({ x, y }),
        angle * (Math.PI / 180),
        type,
        id
      )
      objects.push(newObject)
    } catch {
      console.error("Failed to create object", level.world[id])
    }
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
  let form
  const area = 0
  let material
  let parameters: Array<number | number[]> = []
  let isBird = false
  let isPig = false
  let color

  if (type.startsWith("BIRD")) {
    isBird = true
    shape = "ball"
    color = type.replace("BIRD_", "").toLowerCase()
    parameters = [5]
  }

  if (type.startsWith("PIG")) {
    isPig = true
    shape = "ball"
    material = "pork"
    if (type.includes("SMALL")) {
      parameters = [6]
    } else if (type.includes("MEDIUM")) {
      parameters = [9]
    } else {
      parameters = [12]
    }
  }

  if (type.includes("_BLOCK_")) {
    material = type.split("_")[0].toLowerCase()
    const dim = /.*_BLOCK_(\d+)X(\d+)/.exec(type)
    parameters = [(Number(dim?.[2]) || 4) * 5, (Number(dim?.[1]) || 4) * 5, 0]
  }

  if (type.includes("_TRIANGLE_")) {
    material = type.split("_")[0].toLowerCase()
    const dim = /.*_TRIANGLE_(\d+)X(\d+).*/.exec(type)
    parameters = [(Number(dim?.[2]) || 4) * 5, (Number(dim?.[1]) || 4) * 5, 0]
  }

  if (type.includes("_CIRCLE_")) {
    shape = "ball"
    material = type.split("_")[0].toLowerCase()
    const dim = /.*_CIRCLE_(\d+)X\d+/.exec(type)
    parameters = [(Number(dim?.[1]) || 4) * 2.5, 0]
  }

  if (type.includes("TERRAIN_TEXTURED_HILLS")) {
    color = "black"
    material = undefined
    const dim = /TERRAIN_TEXTURED_HILLS_(\d+)X(\d+)/.exec(type)
    parameters = [(Number(dim?.[2]) || 4) * 5, (Number(dim?.[1]) || 4) * 5, 0]
  }

  if (type.includes("MISC_")) {
    color = "black"
    shape = "ball"
    parameters = [5]
  }

  return {
    shape,
    params: parameters,
    area,
    material,
    form,
    isBird,
    isPig,
    color,
  }
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

export function levelDimensions(objects: ABObject[]) {
  return objects.reduce(
    (acc, curr) => ({
      minX: Math.min(acc.minX, curr.x),
      maxX: Math.max(acc.maxX, curr.x),
      minY: Math.min(acc.minY, curr.y),
      maxY: Math.max(acc.maxY, curr.y),
    }),
    {
      minX: Number.MAX_VALUE,
      maxX: -Number.MAX_VALUE,
      minY: Number.MAX_VALUE,
      maxY: -Number.MAX_VALUE,
    }
  )
}