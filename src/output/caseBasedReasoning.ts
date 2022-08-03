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
 *  From https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
 */
function cyrb53Hash(input: string, seed = 0) {
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

function toggleOverlay(caseParameter: Case, transformation: Transformation) {
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

function transformObject(
  object: IObject,
  transformation: Transformation
): IObject {
  const transformedObject = {
    x: (object.x + transformation.deltaX) * transformation.scale,
    y: (object.y + transformation.deltaY) * transformation.scale,
    area: object.area * transformation.scale ** 2,
    scale: transformation.scale,

    // Can be used unchanges
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

function getPossibleMatches(
  caseObjects: IObject[],
  allObjects: IObject[]
): Array<[IObject, IObject[]]> {
  return caseObjects.map((object) => [
    object,
    getObjectsWithSameMaterialAndForm(object, allObjects),
  ])
}

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

function getObjectsWithSameMaterialAndForm(
  object: IObject,
  allObjects: IObject[]
): IObject[] {
  return allObjects.filter(
    ({ material, form }) => material === object.material && form === object.form
  )
}
