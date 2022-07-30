import { IObject, Scene } from "../types"

interface IFormPredicate {
  id: string
  form: string
}

interface IMaterialPredicate {
  id: string
  material: string
}

export default function parse(text: string): {
  objects: IObject[]
  scene: Scene
} {
  const predicatesByType: Record<string, string[]> = {}

  for (let line of text.split("\n")) {
    line = line.trim()
    if (!line || !line.endsWith(".")) continue

    const predicateName = getPredicateName(line)
    if (predicatesByType[predicateName]) {
      predicatesByType[predicateName].push(line)
    } else {
      predicatesByType[predicateName] = [line]
    }
  }

  const parsedMaterialPredicates = (predicatesByType.hasMaterial ?? []).map(
    (predicate) => parseMaterialPredicate(predicate)
  )

  const parsedFormPredicates = (predicatesByType.hasForm ?? []).map(
    (predicate) => parseFormPredicate(predicate)
  )

  const objs = (predicatesByType.shape ?? [])
    .map((predicate) =>
      parseShapeToObject(
        predicate,
        parsedMaterialPredicates,
        parsedFormPredicates
      )
    )
    .filter((object) => object !== undefined) as IObject[]

  for (const birdPredicate of predicatesByType.bird ?? []) {
    const birdID = getId(birdPredicate)
    const object = objs.find(({ id }) => id === birdID)
    if (object) {
      object.isBird = true
    } else {
      console.error("Failed to set isBird property", birdPredicate, birdID)
    }
  }

  for (const pigPredicate of predicatesByType.pig ?? []) {
    const pigID = getId(pigPredicate)
    const object = objs.find(({ id }) => id === pigID)
    if (object) {
      object.isPig = true
    } else {
      console.error("Failed to set isPig property", pigPredicate, pigID)
    }
  }

  for (const hasColorPredicate of predicatesByType.hasColor ?? []) {
    const [_, objectID, color] = getGenericValues(hasColorPredicate)
    const object = objs.find(({ id }) => id === objectID)
    if (object) {
      object.color = color as string
    } else {
      console.error(
        "Failed to set hasColor property",
        hasColorPredicate,
        objectID
      )
    }
  }

  return {
    objects: objs,
    scene: getScene(predicatesByType),
  }
}

function getId(predicate: string | undefined): string {
  const [_, id] = getGenericValues(predicate)
  return id as string
}

function parseShapePredicate(
  predicate: string | undefined
): IObject | undefined {
  if (!predicate || getPredicateName(predicate) !== "shape") {
    console.error("Failed to parse Shape Predicate", predicate)
    return
  }

  const result = getGenericValues(predicate)

  if (!result || result.length !== 7) {
    throw new Error("Expected 7 arguments in shape predicate: " + predicate)
  }

  const [_, id, shape, x, y, area, parameters] = result

  return { id, shape, x, y, area, params: parameters } as IObject
}

function parseMaterialPredicate(
  predicate: string | undefined
): IMaterialPredicate {
  if (!predicate || getPredicateName(predicate) !== "hasMaterial") {
    console.error("Failed to parse hasMaterial Predicate", predicate)
    return { id: "unknown", material: "unknown" }
  }

  const [_, id, material] = getGenericValues(predicate)

  return { id, material } as IMaterialPredicate
}

function parseFormPredicate(predicate: string | undefined): IFormPredicate {
  if (!predicate || getPredicateName(predicate) !== "hasForm") {
    console.error("Failed to parse hasForm Predicate", predicate)
    return { id: "unknown", form: "unknown" }
  }

  const [_, id, form] = getGenericValues(predicate)

  return { id, form } as IFormPredicate
}

function getPredicateName(predicate: string | undefined): string {
  if (!predicate) {
    return "unknownPredicate"
  }

  return predicate.split("(")[0]
}

function getMaterialFor(
  idParameter: string,
  materialPredicates: IMaterialPredicate[]
) {
  const { material } = materialPredicates.find(
    ({ id }) => id === idParameter
  ) ?? {
    material: undefined,
  }

  return material
}

function getFormFor(idParameter: string, formPredicates: IFormPredicate[]) {
  const { form } = formPredicates.find(({ id }) => id === idParameter) ?? {
    form: undefined,
  }

  return form
}

function getGenericValues(
  predicate: string | undefined
): Array<string | number | number[]> {
  if (!predicate) {
    console.error("Cannot determine values of undefined")
    return []
  }

  const name = predicate.split("(")[0]

  predicate = "[" + predicate.replace(name + "(", "").replace(").", "") + "]"

  const args = JSON.parse(
    predicate.replace(/(['"])?([a-zA-Z]\w+)(['"])?/g, '"$2"')
  ) as Array<string | number | number[]>

  return [name.trim(), ...args]
}

function parseShapeToObject(
  shapePredicate: string,
  parsedMaterialPredicates: IMaterialPredicate[],
  parsedFormPredicates: IFormPredicate[]
): IObject | undefined {
  let parsedObject
  try {
    parsedObject = parseShapePredicate(shapePredicate)
  } catch {}

  if (!parsedObject) {
    return undefined
  }

  const { id, x, y, shape, area, params } = parsedObject

  const material = getMaterialFor(id, parsedMaterialPredicates)
  const form = getFormFor(id, parsedFormPredicates)
  return {
    id,
    x,
    y,
    shape,
    material,
    params,
    area,
    form,
    scale: 1,
    unscaledParams: JSON.parse(JSON.stringify(params)) as Array<
      number | number[]
    >,
    vectors:
      shape === "poly"
        ? params.map((entry, index) => {
            if (index === 0 || typeof entry === "number") return entry
            const [x1, y1] = entry
            const newX = x1 - x
            const newY = y1 - y
            return [newX, newY]
          })
        : undefined,
  } as IObject
}

function getScene(predicatesByType: Record<string, string[]>): Scene {
  const groundY = getGenericValues(
    predicatesByType.ground_plane[0]
  )[1] as number

  const derivedPredicateKeys = [
    "belongsTo",
    "collapsesInDirection",
    "hasOrientation",
    "hasSize",
    "isAnchorPointFor",
    "isBelow",
    "isCollapsable",
    "isLeft",
    "isOn",
    "isOver",
    "isRight",
    "isTower",
    "protects",
    "structure",
    "supports",
  ]

  const derivedPredicates = derivedPredicateKeys.flatMap(
    (key) => predicatesByType[key] ?? []
  )
  const commonPredicateKeys = [
    "hill",
    "ground_plane",
    "birdOrder",
    "sceneRepresentation",
    "scene_scale",
    "slingshotPivot",
  ]
  const commonPredicates = [
    "situation_name('edited_situation').",
    ...commonPredicateKeys.flatMap((key) => predicatesByType[key] ?? []),
  ]

  return {
    groundY,
    derivedPredicates,
    commonPredicates,
  }
}
