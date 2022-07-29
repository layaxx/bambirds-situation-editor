import { IObject } from "../types"

interface IFormPredicate {
  id: string
  form: string
}

interface IMaterialPredicate {
  id: string
  material: string
}

export default function parse(text: string) {
  const predicatesByType: Record<string, string[]> = {}

  text.split("\n").forEach((line) => {
    line = line.trim()
    if (!line || !line.endsWith(".")) return

    const predicateName = getPredicateName(line)
    if (!predicatesByType[predicateName]) {
      predicatesByType[predicateName] = [line]
    } else {
      predicatesByType[predicateName].push(line)
    }
  })

  const parsedMaterialPredicates = (predicatesByType.hasMaterial ?? []).map(
    parseMaterialPredicate
  )

  const parsedFormPredicates = (predicatesByType.hasForm ?? []).map(
    parseFormPredicate
  )

  const objs = (predicatesByType.shape ?? [])
    .map((shapePredicate) => {
      var parsedObject
      try {
        parsedObject = parseShapePredicate(shapePredicate)
      } catch {}
      if (!parsedObject) {
        return null
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
        unscaledParams: JSON.parse(JSON.stringify(params)),
      }
    })
    .filter((obj) => obj !== null) as IObject[]

  ;(predicatesByType.bird ?? []).forEach((birdPredicate) => {
    const birdID = getID(birdPredicate)
    const obj = objs.find(({ id }) => id === birdID)
    if (obj) {
      obj.isBird = true
    } else {
      console.error("Failed to set isBird property", birdPredicate, birdID)
    }
  })
  ;(predicatesByType.pig ?? []).forEach((pigPredicate) => {
    const pigID = getID(pigPredicate)
    const obj = objs.find(({ id }) => id === pigID)
    if (obj) {
      obj.isPig = true
    } else {
      console.error("Failed to set isPig property", pigPredicate, pigID)
    }
  })
  ;(predicatesByType.hasColor ?? []).forEach((hasColorPredicate) => {
    const [_, objID, color] = getGenericValues(hasColorPredicate)
    const obj = objs.find(({ id }) => id === objID)
    if (obj) {
      obj.color = color as string
    } else {
      console.error("Failed to set hasColor property", hasColorPredicate, objID)
    }
  })

  return {
    objects: objs,
    scene: {
      groundY: getGenericValues(predicatesByType["ground_plane"][0])[1],
      derivedPredicates: [
        ...(predicatesByType.belongsTo ?? []),
        ...(predicatesByType.collapsesInDirection ?? []),
        ...(predicatesByType.hasOrientation ?? []),
        ...(predicatesByType.hasSize ?? []),
        ...(predicatesByType.isAnchorPointFor ?? []),
        ...(predicatesByType.isBelow ?? []),
        ...(predicatesByType.isCollapsable ?? []),
        ...(predicatesByType.isLeft ?? []),
        ...(predicatesByType.isOn ?? []),
        ...(predicatesByType.isOver ?? []),
        ...(predicatesByType.isRight ?? []),
        ...(predicatesByType.isTower ?? []),
        ...(predicatesByType.protects ?? []),
        ...(predicatesByType.structure ?? []),
        ...(predicatesByType.supports ?? []),
      ],
      commonPredicates: [
        ...(predicatesByType.hill ?? []),
        ...(predicatesByType.ground_plane ?? []),
        ...(predicatesByType.birdOrder ?? []),
        ...(predicatesByType.sceneRepresentation ?? []),
        ...(predicatesByType.scene_scale ?? []),
        ...(predicatesByType.slingshotPivot ?? []),
        "situation_name('edited_situation').",
      ],
    },
  }
}

function getID(predicate: string | undefined): string {
  const [_, id] = getGenericValues(predicate)
  return id as string
}

function parseShapePredicate(predicate: string | undefined): IObject | null {
  if (!predicate || getPredicateName(predicate) !== "shape") {
    console.error("Failed to parse Shape Predicate", predicate)
    return null
  }

  const result = getGenericValues(predicate)

  if (!result || result.length !== 7) {
    throw new Error("Expected 7 arguments in shape predicate: " + predicate)
  }

  const [_, id, shape, x, y, area, params] = result

  return { id, shape, x, y, area, params } as IObject
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
  idParam: string,
  materialPredicates: IMaterialPredicate[]
) {
  const { material } = materialPredicates.find(({ id }) => id === idParam) ?? {
    material: undefined,
  }

  return material
}

function getFormFor(idParam: string, formPredicates: IFormPredicate[]) {
  const { form } = formPredicates.find(({ id }) => id === idParam) ?? {
    form: undefined,
  }

  return form
}

function getGenericValues(
  predicate: string | undefined
): (string | number | number[])[] {
  if (!predicate) {
    console.error("Cannot determine values of undefined")
    return []
  }

  const name = predicate.split("(")[0]

  predicate = "[" + predicate.replace(name + "(", "").replace(").", "") + "]"

  const args = JSON.parse(
    predicate.replace(/(['"])?([a-zA-Z][a-zA-Z0-9_]+)(['"])?/g, '"$2"')
  )

  return [name.trim(), ...args]
}
