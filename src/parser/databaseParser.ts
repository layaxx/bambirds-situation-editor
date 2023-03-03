import { ABObject } from "objects/angryBirdsObject"
import { Case } from "types"
import { getGenericValues } from "./prologHelper"

/**
 * Parses a database.pl file from the Case Based Reasoning module into
 * javascript representations of the cases
 *
 * @param text - text content of the database.pl file
 * @returns an array of parsed cases
 */
export default function parseDatabase(text: string): Case[] {
  const allCases: Array<Case | undefined> = []
  let currentCase: string[] = []
  let caseID: number | undefined
  for (let line of text.split("\n")) {
    line = line.trim()

    if (!line || line.startsWith(":-")) continue

    if (/^% (\d+)/.test(line)) {
      const newID = Number((/^% (\d+)/.exec(line) ?? [undefined, undefined])[1])
      if (caseID !== undefined) {
        allCases.push(generateCase(caseID, currentCase))
        currentCase = []
      }

      caseID = newID
    }

    if (!line.endsWith(".")) continue

    currentCase.push(line)
  }

  return allCases.filter(
    (caseParameter): caseParameter is Case => caseParameter !== undefined
  )
}

/**
 * Generates a case from a given ID and an array of prolog predicates that belong to this case
 *
 * @param caseID - id of the new case
 * @param currentCasePredicates - string representations of predicates describing the new case
 *
 * @returns the new case
 */
function generateCase(
  caseID: number,
  currentCasePredicates: string[]
): Case | undefined {
  const shotPredicate = currentCasePredicates.find((string) =>
    string.startsWith("shot(")
  )

  if (!shotPredicate) {
    console.error(`Failed to determine Shot for case ${caseID}`)
    return undefined
  }

  const [_name, _caseID, shotX, shotY] = getGenericValues(shotPredicate)

  if (!shotX || !shotY) {
    console.error(`Failed to determine Shot coordinates for case ${caseID}`)
    return undefined
  }

  const objects: ABObject[] = []
  const parsedPredicates = new Map<
    string,
    Array<{
      name: string
      values: Array<
        string | number | number[] | [number, ...Array<[number, number]>]
      >
    }>
  >()
  currentCasePredicates.forEach((predicate) => {
    const [name, id, ...rest] = getGenericValues(predicate)
    if (parsedPredicates.has(String(id))) {
      parsedPredicates
        .get(String(id))!
        .push({ name: String(name), values: rest as Array<number | string> })
    } else {
      parsedPredicates.set(String(id), [
        { name: String(name), values: rest as Array<number | string> },
      ])
    }
  })

  for (const [id, predicates] of parsedPredicates.entries()) {
    if (predicates.length < 2) {
      continue
    }

    const shapePredicate = predicates.find(
      (predicate) => predicate.name === "case_shape"
    )
    const materialPredicate = predicates.find(
      (predicate) => predicate.name === "case_hasMaterial"
    )

    if (!shapePredicate || !materialPredicate) {
      console.warn("Failed to parse case-object " + id)
      continue
    }

    const pigPredicate = predicates.find(
      (predicate) => predicate.name === "case_pig"
    )
    const formPredicate = predicates.find(
      (predicate) => predicate.name === "case_hasForm"
    )

    const [shape, x, y, area, parameter] = shapePredicate.values

    objects.push(
      new ABObject(
        {
          id: String(id),
          area: Number(area),
          x: Number(x),
          y: Number(y),
          shape: String(shape),
          material: String(materialPredicate.values[0]),
          // eslint-disable-next-line @typescript-eslint/naming-convention
          _unscaledParams: [
            ...(typeof parameter === "object" ? parameter : []),
          ],
          params: [...(typeof parameter === "object" ? parameter : [])],
          isPig: Boolean(pigPredicate),
          isBird: false,
          scale: 1,
          form:
            formPredicate?.values[0] === undefined
              ? undefined
              : String(formPredicate?.values[0]),
          // eslint-disable-next-line @typescript-eslint/naming-convention
          _vectors: (String(shape) === "poly"
            ? (typeof parameter === "object" ? parameter : []).map(
                (entry, index) => {
                  if (index === 0 || typeof entry === "number") return entry
                  const [x1, y1] = entry
                  const newX = x1 - Number(x)
                  const newY = y1 - Number(y)
                  return [newX, newY]
                }
              )
            : undefined) as [number, ...Array<[number, number]>] | undefined,
        } as unknown as ABObject,
        String(id)
      )
    )
  }

  return {
    shootAt: { x: Number(shotX), y: Number(shotY) },
    id: caseID,
    objects,
  }
}
