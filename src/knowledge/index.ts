/* eslint-disable complexity */
import { ABObject } from "../objects/angryBirdsObject"

export function getRelationsBetweenTwoObjects(
  object1: ABObject,
  object2: ABObject
) {
  console.log(
    "getRelationsBetweenTwoObjects",
    checkExtendedIntervalAlgebra(object1, object2)
  )
}

/** Reduced Interval Algebra Relations */
enum RIA {
  BEFORE,
  OVERLAPS,
  DURING,
  EQUAL,
}

/** Basic Interval Algebra Relations */
enum IA {
  BEFORE,
  MEETS,
  OVERLAPS,
  STARTS,
  DURING,
  FINISHES,
  EQUAL,
}

/** Extended Interval Algebra Relations */
enum EIA {
  BEFORE,
  MEETS,
  MOST_OVERLAPS_MOST,
  LESS_OVERLAPS_LESS,
  MOST_OVERLAPS_LESS,
  LESS_OVERLAPS_MOST,
  STARTS_COVERS_MOST,
  STARTS_COVERS_LESS,
  DURING_LEFT,
  DURING_RIGHT,
  DURING_CENTER,
  FINISHES_MOST,
  FINISHES_LESS,
  EQUAL,
}

function checkGenericAlgebra(
  a: ABObject,
  b: ABObject,
  func: (
    arg0: number,
    arg1: number,
    arg2: number,
    arg3: number
  ) => (EIA | IA | RIA) | undefined,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  enum_: typeof EIA | typeof IA | typeof RIA
) {
  const abX = func(
    a.getLeftBound(),
    a.getRightBound(),
    b.getLeftBound(),
    b.getRightBound()
  )
  const abY = func(
    a.getUpperBound(),
    a.getLowerBound(),
    b.getUpperBound(),
    b.getLowerBound()
  )
  const baX = func(
    b.getLeftBound(),
    b.getRightBound(),
    a.getLeftBound(),
    a.getRightBound()
  )
  const baY = func(
    b.getUpperBound(),
    b.getLowerBound(),
    a.getUpperBound(),
    a.getLowerBound()
  )

  if (abX !== undefined)
    console.log(`Found Predicate: ${enum_[abX]}(${a.id}, ${b.id}, X)`)

  if (abY !== undefined)
    console.log(`Found Predicate: ${enum_[abY]}(${a.id}, ${b.id}, Y)`)

  if (baX !== undefined)
    console.log(`Found Predicate: ${enum_[baX]}(${b.id}, ${a.id}, X)`)

  if (baY !== undefined)
    console.log(`Found Predicate: ${enum_[baY]}(${b.id}, ${a.id}, Y)`)

  if (
    (abX === undefined && baX === undefined) ||
    (abY === undefined && baY === undefined)
  )
    console.error("Failed to find two relations between", { a, b })

  return {
    x: enum_[abX ?? baX ?? 0],
    y: enum_[abY ?? baY ?? 0],
  }
}

function checkBasicIntervalAlgebra(a: ABObject, b: ABObject) {
  return checkGenericAlgebra(a, b, getBasicIARelation, IA)
}

function checkExtendedIntervalAlgebra(a: ABObject, b: ABObject) {
  return checkGenericAlgebra(a, b, getExtendedIARelation, EIA)
}

function getBasicIARelation(
  xStart: number,
  xEnd: number,
  yStart: number,
  yEnd: number
): IA | undefined {
  if (xStart === yStart) {
    if (xEnd === yEnd) return IA.EQUAL

    if (xEnd < yEnd) return IA.STARTS
  }

  if (xStart < yStart) {
    if (xEnd < yStart) return IA.BEFORE

    if (xEnd === yStart) return IA.MEETS

    if (xEnd > yStart && xEnd < yEnd) return IA.OVERLAPS
  }

  if (xStart > yStart) {
    if (xEnd < yEnd) return IA.DURING

    if (xEnd === yEnd) return IA.FINISHES
  }
}

function getExtendedIARelation(
  xStart: number,
  xEnd: number,
  yStart: number,
  yEnd: number
): EIA | undefined {
  const xMiddle = (xEnd + xStart) / 2
  const yMiddle = (yEnd + yStart) / 2

  if (xStart === yStart) {
    if (xEnd === yEnd) return EIA.EQUAL

    if (xEnd > yStart && xEnd < yMiddle) return EIA.STARTS_COVERS_LESS

    if (xEnd >= yMiddle) return EIA.STARTS_COVERS_MOST
  }

  if (xStart < yStart) {
    if (xEnd < yStart) return EIA.BEFORE

    if (xEnd >= yMiddle && xMiddle >= yStart && xEnd < yEnd)
      return EIA.MOST_OVERLAPS_MOST

    if (xMiddle >= yStart && xEnd < yMiddle) return EIA.MOST_OVERLAPS_LESS

    if (xEnd === yStart) return EIA.MEETS
  }

  if (xMiddle < yStart && xEnd >= yMiddle && xEnd < yEnd)
    return EIA.LESS_OVERLAPS_MOST

  if (xMiddle < yStart && xEnd > yStart && xEnd < yMiddle)
    return EIA.LESS_OVERLAPS_LESS

  if (xStart > yMiddle && xStart < yEnd && xEnd === yEnd)
    return EIA.FINISHES_LESS

  if (xStart > yStart && xStart <= yMiddle && xEnd === yEnd)
    return EIA.FINISHES_MOST

  if (xStart > yStart && xEnd <= yMiddle) return EIA.DURING_LEFT

  if (xStart > yStart && xStart < yMiddle && xEnd > yMiddle && xEnd < yEnd)
    return EIA.DURING_CENTER

  if (xStart >= yMiddle && xEnd < yEnd) return EIA.DURING_RIGHT
}
