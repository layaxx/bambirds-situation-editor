import { ABObject } from "objects/angryBirdsObject"
import { IFormPredicate, IMaterialPredicate, Scene } from "types"
import { getGenericValues } from "./prologHelper"

export default function parse(text: string): {
  objects: ABObject[]
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

  const objects = (predicatesByType.shape ?? [])
    .map(
      (predicate) =>
        new ABObject(predicate, parsedMaterialPredicates, parsedFormPredicates)
    )
    .filter((object) => object !== undefined)

  for (const birdPredicate of predicatesByType.bird ?? []) {
    const birdID = getId(birdPredicate)
    const object = objects.find(({ id }) => id === birdID)
    if (object) {
      object.isBird = true
    } else {
      console.error("Failed to set isBird property", birdPredicate, birdID)
    }
  }

  for (const pigPredicate of predicatesByType.pig ?? []) {
    const pigID = getId(pigPredicate)
    const object = objects.find(({ id }) => id === pigID)
    if (object) {
      object.isPig = true
    } else {
      console.error("Failed to set isPig property", pigPredicate, pigID)
    }
  }

  for (const hasColorPredicate of predicatesByType.hasColor ?? []) {
    const [_, objectID, color] = getGenericValues(hasColorPredicate)
    const object = objects.find(({ id }) => id === objectID)
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
    objects,
    scene: getScene(predicatesByType),
  }
}

/**
 * Returns the id of a given prolog predicate under the assumption that the id is the first
 * parameter to the predicate, i.e. the predicate
 * takes the form of predicate_name(id, optionally, however, many, [other, parameters])
 *
 * @param predicate - string representation of the prolog predicate
 * @returns the first parameter of the predicate, assumed to be an ID
 */
function getId(predicate: string | undefined): string {
  const [_, id] = getGenericValues(predicate)
  return id as string
}

/**
 * Parses a prolog "shape/6" predicate.
 *
 * expects the predicate to be like: shape(id, shape, xCoordinate, yCoordinate, area, parameters)
 *
 * @param predicate - string representation of the shape predicate
 * @returns a Partial AngryBirds Object or undefined if parsing fails
 */
export function parseShapePredicate(
  predicate: string | undefined
): Pick<ABObject, "id" | "shape" | "x" | "y" | "area" | "params"> | undefined {
  if (!predicate || getPredicateName(predicate) !== "shape") {
    console.error("Failed to parse Shape Predicate", predicate)
    return
  }

  const result = getGenericValues(predicate)

  if (!result || result.length !== 7) {
    throw new Error("Expected 7 arguments in shape predicate: " + predicate)
  }

  const [_, id, shape, x, y, area, parameters] = result

  return { id, shape, x, y, area, params: parameters } as Pick<
    ABObject,
    "id" | "shape" | "x" | "y" | "area" | "params"
  >
}

/**
 * Parses a prolog "hasMaterial/6" predicate.
 *
 * expects the predicate to be like: hasMaterial(id, material, ...whatever)
 *
 * @param predicate - string representation of the hasMaterial predicate
 * @returns a parsed MaterialPredicate object, with "unknown" values if parsing failed
 */
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

/**
 * Parses a prolog "hasForm/2" predicate.
 *
 * expects the predicate to be like: hasForm(id, form)
 *
 * @param predicate - string representation of the hasForm predicate
 * @returns a parsed FormPredicate object, with "unknown" values if parsing failed
 */
function parseFormPredicate(predicate: string | undefined): IFormPredicate {
  if (!predicate || getPredicateName(predicate) !== "hasForm") {
    console.error("Failed to parse hasForm Predicate", predicate)
    return { id: "unknown", form: "unknown" }
  }

  const [_, id, form] = getGenericValues(predicate)

  return { id, form } as IFormPredicate
}

/**
 * Returns the name of the given prolog predicate
 *
 * @param predicate - string representation of the predicate to be parsed
 * @returns the name of the predicate
 */
function getPredicateName(predicate: string | undefined): string {
  if (!predicate) {
    return "unknownPredicate"
  }

  return predicate.split("(")[0]
}

/**
 * Tries to find a matching material for the object with the
 * given ID from the given parsed material predicates
 *
 * @param idParameter - id of the object
 * @param materialPredicates - list of parsed material predicates
 *
 * @returns the material of the object, possibly undefined
 */
export function getMaterialFor(
  idParameter: string,
  materialPredicates: IMaterialPredicate[]
): string | undefined {
  const { material } = materialPredicates.find(
    ({ id }) => id === idParameter
  ) ?? {
    material: undefined,
  }

  return material
}

/**
 * Tries to find a matching form for the object with the
 * given ID from the given parsed form predicates
 *
 * @param idParameter - id of the object
 * @param formPredicates - list of parsed form predicates
 *
 * @returns the form of the object, possibly undefined
 */
export function getFormFor(
  idParameter: string,
  formPredicates: IFormPredicate[]
): string | undefined {
  const { form } = formPredicates.find(({ id }) => id === idParameter) ?? {
    form: undefined,
  }

  return form
}

/**
 * Returns Scene information, including y-coordinates of ground plane,
 * derived and common predicates
 *
 * @param predicatesByType - name to values mapping of all parsed predicates
 * @returns the parsed scene
 */
function getScene(predicatesByType: Record<string, string[]>): Scene {
  const groundY = getGenericValues(
    predicatesByType.ground_plane?.at(0)
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
