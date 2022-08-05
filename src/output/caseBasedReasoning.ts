import { $svgElements } from "../app"
import { scaleObjectInternal } from "../objects/helper"
import { Case, IObject, Transformation } from "../types"
import { drawCrossAt, drawShape } from "./svg"

export function analyzeCase(
  caseParameter: Case,
  objects: IObject[]
): HTMLElement {
  const container = document.createElement("div")
  container.setAttribute("style", `overflow: hidden;`)

  // Add Heading
  const heading = document.createElement("h3")
  heading.setAttribute("style", "margin-bottom: 0;")
  heading.textContent = `Case ${caseParameter.id}`
  container.append(heading)

  // Draw SVG
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  svg.setAttribute("width", "400")
  svg.setAttribute("height", "200")
  let minX = Number.MAX_VALUE
  let maxX = Number.MIN_VALUE
  let minY = Number.MAX_VALUE
  let maxY = Number.MIN_VALUE
  caseParameter.objects.forEach((object) => {
    minX = Math.min(minX, object.x)
    maxX = Math.max(maxX, object.x)
    minY = Math.min(minY, object.y)
    maxY = Math.max(maxY, object.y)
  })
  const padding = 50
  const upperLeftX = minX - padding
  const upperLeftY = minY - padding
  const width = maxX - minX + 2 * padding
  const height = maxY - minY + 2 * padding
  svg.setAttribute("viewBox", `${upperLeftX} ${upperLeftY} ${width} ${height}`)
  svg.setAttribute("style", "background-color: white; transform-origin: 0% 0%")
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
  container.append(svg)
  svg.append(group)

  caseParameter.objects.forEach((object) => {
    drawShape(object, group)
  })

  drawCrossAt(caseParameter.shootAt, group)

  // Determine if case is applicable
  const transformations = isCaseApplicable(caseParameter, objects)
  const paragraph = document.createElement("p")
  paragraph.textContent = `This case is ${
    transformations.length > 0 ? "maybe" : "not"
  } applicable.`
  paragraph.setAttribute("style", "font-style: italic; margin-bottom: 0;")
  container.append(paragraph)

  const list = document.createElement("ul")
  transformations.forEach((transformation) => {
    const listElement = document.createElement("li")
    listElement.textContent = JSON.stringify(transformation, undefined, 2)
    const checkBox = document.createElement("input")
    checkBox.setAttribute("type", "checkbox")
    checkBox.addEventListener("change", () => {
      toggleOverlay(caseParameter, transformation)
    })
    listElement.append(checkBox)
    list.append(listElement)
  })
  container.append(list)
  container.setAttribute(
    "style",
    `overflow: hidden; padding-left: 1rem; border-left: solid 0.5rem ${
      transformations.length > 0 ? "green" : "orange"
    } `
  )

  return container
}

/**
 * Generates a 53-bit Hash from a given string input and optionally a given seed number
 *
 *  From https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
 *
 * @param input - the string that shall be hashed
 * @param seed - optional number which allows for two identical strings to have different hash values
 *
 * @returns the computed hash (as a number)
 */
function cyrb53Hash(input: string, seed = 0): number {
  let h1 = 0xde_ad_be_ef ^ seed // eslint-disable-line no-bitwise
  let h2 = 0x41_c6_ce_57 ^ seed // eslint-disable-line no-bitwise
  for (let i = 0, ch; i < input.length; i++) {
    ch = input.charCodeAt(i) // eslint-disable-line unicorn/prefer-code-point
    h1 = Math.imul(h1 ^ ch, 2_654_435_761) // eslint-disable-line no-bitwise
    h2 = Math.imul(h2 ^ ch, 1_597_334_677) // eslint-disable-line no-bitwise
  }

  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2_246_822_507) ^ // eslint-disable-line no-bitwise
    Math.imul(h2 ^ (h2 >>> 13), 3_266_489_909) // eslint-disable-line no-bitwise
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2_246_822_507) ^ // eslint-disable-line no-bitwise
    Math.imul(h1 ^ (h1 >>> 13), 3_266_489_909) // eslint-disable-line no-bitwise
  return 4_294_967_296 * (2_097_151 & h2) + (h1 >>> 0) // eslint-disable-line no-bitwise
}

/**
 * Toggles the overlay for the given combination of case and transformation.
 *
 * If the overlay does not exist already, it is created, otherwise its hidden state is toggled
 *
 * @param caseParameter - the case
 * @param transformation - the transformation that shall be applied to the case
 */
function toggleOverlay(
  caseParameter: Case,
  transformation: Transformation
): void {
  const id = `case-${caseParameter.id}_${cyrb53Hash(
    JSON.stringify({ transformation })
  ).toString(16)}`

  const existingElement = $svgElements.$groupOverlay.querySelector(`#${id}`)

  if (existingElement === null) {
    const newElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    )

    newElement.setAttribute("id", id)

    caseParameter.objects.forEach((object) => {
      drawShape(
        {
          ...transformObject(object, transformation),
          material: "cbr",
        },
        newElement
      )
    })

    $svgElements.$groupOverlay.append(newElement)
  } else if (existingElement.hasAttribute("hidden")) {
    existingElement.removeAttribute("hidden")
  } else {
    existingElement.setAttribute("hidden", "true")
  }
}

/**
 * Applies a given transformation to a copy of the given object and returns that copy
 *
 * @param object - the object a copy of which shall be transformed
 * @param transformation - the transformation that is applied
 *
 * @returns the transformed copy of object
 */
function transformObject(
  object: IObject,
  transformation: Transformation
): IObject {
  const transformedObject = {
    x: (object.x + transformation.deltaX) * transformation.scale,
    y: (object.y + transformation.deltaY) * transformation.scale,
    area: object.area * transformation.scale ** 2,
    scale: transformation.scale,

    // Can be used unchanged
    unscaledParams: object.unscaledParams,
    params: object.params,
    vectors: object.vectors,
    id: object.id,
    form: object.form,
    shape: object.shape,
    material: object.material,
    isBird: object.isBird,
    isPig: object.isPig,
    color: object.color,
  }

  scaleObjectInternal(transformedObject)
  return transformedObject
}

/**
 * Finds all possible Transformations of the given case such that it matches the current objects.
 *
 * Currently obsolete as its is the same as {@link getTransformations}, but could be used in the
 * future to apply found transformations to the shots that are associated with the given case.
 *
 * @param caseParameter - the case for which transformations shall be found iff they exist
 * @param objects - the objects of the current scene
 *
 * @returns array of transformations that make case match the current scene
 */
function isCaseApplicable(
  caseParameter: Case,
  objects: IObject[]
): Transformation[] {
  // Do all objects match?
  const transformations = getTransformations(caseParameter.objects, objects)

  // (optional) => transform shot

  // if transformation is found, case is applicable, otherwise it is not
  return transformations
}

/**
 * Finds all possible Transformations of the given case such that it matches the current objects.
 *
 * @param caseObjects - the case for which transformations shall be determined
 * @param objects - the objects of the current scene
 *
 * @returns array of transformations that make case match the current scene
 */
function getTransformations(
  caseObjects: IObject[],
  objects: IObject[]
): Transformation[] {
  const transformations: Transformation[] = []

  const [[object, matches], ...rest] = getPossibleMatches(caseObjects, objects)

  for (const matchedObject of matches) {
    const transformation = getTransformationBetweenTwoObjects(
      object,
      matchedObject
    )

    if (hasMatches(rest, transformation)) {
      transformations.push(transformation)
    }
  }

  return transformations
}

/**
 * For each object of caseObject, finds objects of allObjects that
 * might possibly match after a transformation.
 *
 * @param caseObjects - array of objects for which possible matches shall be determined
 * @param allObjects - array of objects from which possible matches are taken
 *
 * @returns an array of two-member-array, of the form [[caseObject1, [possibleMatch1, possibleMatch2, ...]], ....]
 */
function getPossibleMatches(
  caseObjects: IObject[],
  allObjects: IObject[]
): Array<[IObject, IObject[]]> {
  return caseObjects.map((object) => [
    object,
    getObjectsWithSameMaterialAndForm(object, allObjects),
  ])
}

/**
 * Determines if every object has a match in the array of possible
 * matches for the given transformation.
 *
 * @param input - array of two-member-array of the form [[object, [list, of, possible, matches, ...]], ...]
 * @param transformation - the transformation to be applied to objects
 *
 * @returns true iff all objects have a match for the given transformation
 */
function hasMatches(
  input: Array<[IObject, IObject[]]>,
  transformation: Transformation
): boolean {
  if (input.length === 0) {
    return true
  }

  const [[caseObject, potentialMatches], ...rest] = input

  const transformedCaseObject = transformObject(caseObject, transformation)

  const hasMatch = potentialMatches.some((regularObject) => {
    return (
      transformedCaseObject.material === regularObject.material &&
      transformedCaseObject.shape === regularObject.shape &&
      coordinatesWithinThreshold(transformedCaseObject, regularObject)
    )
  })

  return hasMatch && hasMatches(rest, transformation)
}

/**
 * Returns a transformation such that if it is applied to caseObject,
 * caseObject then matches regularObject in coordinates and size
 *
 * @param caseObject - the first object
 * @param regularObject - the second object
 *
 * @returns the transformation necessary to transform caseObject into regularObject
 */
function getTransformationBetweenTwoObjects(
  caseObject: IObject,
  regularObject: IObject
): Transformation {
  return {
    deltaX: regularObject.x - caseObject.x,
    deltaY: regularObject.y - caseObject.y,
    scale: Math.sqrt(regularObject.area / caseObject.area),
  }
}

/**
 * Determines whether object1 and object2 are similar enough in size and position to be
 * considered matching.
 *
 * @param object1 - the first object
 * @param object2 - the second object
 *
 * @returns true iff both objects are similar enough in position and size
 */
function coordinatesWithinThreshold(
  object1: IObject,
  object2: IObject
): boolean {
  const threshold = 30

  const isInX =
    object1.x - threshold <= object2.x && object2.x <= object1.x + threshold

  const isInY =
    object1.y - threshold <= object2.y && object2.y <= object1.y + threshold

  const isInA =
    object1.area - threshold <= object2.area &&
    object2.area <= object1.area + threshold

  return isInX && isInY && isInA
}

/**
 * Returns an array of objects that have the same material and form as the given object
 *
 * @param object - the reference object
 * @param allObjects - list of all available objects
 *
 * @returns array with objects that have the same material and form as the reference object
 */
function getObjectsWithSameMaterialAndForm(
  object: IObject,
  allObjects: IObject[]
): IObject[] {
  return allObjects.filter(
    ({ material, form }) => material === object.material && form === object.form
  )
}
