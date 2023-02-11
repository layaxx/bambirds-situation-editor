/* eslint-disable complexity */
import { ABObject } from "../objects/angryBirdsObject"

export function getRelationsBetweenTwoObjects(
  object1: ABObject,
  object2: ABObject
) {
  console.log(
    "getRelationsBetweenTwoObjects",
    checkBasicIntervalAlgebra(object1, object2)
  )
}

/** Reduced Interval Algebra Relations */
enum RIA {
  BEFORE,
  AFTER,
  OVERLAPS,
  OVERLAPS_INV,
  DURING,
  DURING_INV,
  EQUAL,
}

/** Basic Interval Algebra Relations */
enum IA {
  BEFORE,
  AFTER,
  MEETS,
  MEETS_INV,
  OVERLAPS,
  OVERLAPS_INV,
  STARTS,
  STARTS_INV,
  DURING,
  DURING_INV,
  FINISHES,
  FINISHES_INV,
  EQUAL,
}

/** Extended Interval Algebra Relations */
enum EIA {
  BEFORE,
  AFTER,
  MEETS,
  MEETS_INV,
  MOST_OVERLAPS_MOST,
  MOST_OVERLAPS_MOST_INV,
  LESS_OVERLAPS_LESS,
  LESS_OVERLAPS_LESS_INV,
  MOST_OVERLAPS_LESS,
  MOST_OVERLAPS_LESS_INV,
  LESS_OVERLAPS_MOST,
  LESS_OVERLAPS_MOST_INV,
  STARTS_COVERS_MOST,
  STARTS_COVERS_MOST_INV,
  STARTS_COVERS_LESS,
  STARTS_COVERS_LESS_INV,
  DURING_LEFT,
  DURING_LEFT_INV,
  DURING_RIGHT,
  DURING_RIGHT_INV,
  DURING_MIDDLE,
  DURING_MIDDLE_INV,
  FINISHES_MOST,
  FINISHES_MOST_INV,
  FINISHES_LESS,
  FINISHES_LESS_INV,
  EQUAL,
}

function checkBasicIntervalAlgebra(x: ABObject, y: ABObject) {
  return {
    x: IA[
      getBasicIARelation(
        x.getLeftBound(),
        x.getRightBound(),
        y.getLeftBound(),
        y.getRightBound()
      )
    ],
    y: IA[
      getBasicIARelation(
        x.getUpperBound(),
        x.getLowerBound(),
        y.getUpperBound(),
        y.getLowerBound()
      )
    ],
  }
}

function getBasicIARelation(
  xStart: number,
  xEnd: number,
  yStart: number,
  yEnd: number
): IA {
  if (xStart === yStart) {
    if (xEnd === yEnd) {
      return IA.EQUAL
    }

    if (xEnd < yEnd) {
      return IA.STARTS
    }

    return IA.STARTS_INV
  }

  if (xStart < yStart) {
    if (xEnd < yStart) {
      return IA.BEFORE
    }

    if (xEnd === yStart) {
      return IA.MEETS
    }

    if (xEnd === yEnd) {
      return IA.FINISHES_INV
    }

    if (xEnd > yStart && xEnd < yEnd) {
      return IA.OVERLAPS
    }

    return IA.DURING_INV
  }

  if (xStart > yEnd) {
    return IA.AFTER
  }

  if (xStart === yEnd) {
    return IA.MEETS_INV
  }

  if (xEnd < yEnd) {
    return IA.DURING
  }

  if (xEnd === yEnd) {
    return IA.FINISHES
  }

  return IA.OVERLAPS_INV
}

function getExtendedIARelation(
  xStart: number,
  xEnd: number,
  yStart: number,
  yEnd: number
): EIA {
  const xMiddle = (xEnd + xStart) / 2
  const yMiddle = (yEnd + yStart) / 2

  if (xStart === yStart) {
    if (xEnd === yEnd) return EIA.EQUAL

    if (xEnd > yStart && xEnd < yMiddle) return EIA.STARTS_COVERS_LESS

    if (yEnd > xStart && yEnd < xMiddle) return EIA.STARTS_COVERS_LESS_INV

    if (xEnd >= yMiddle) return EIA.STARTS_COVERS_MOST

    if (yEnd >= xMiddle) return EIA.STARTS_COVERS_MOST_INV

    throw new Error(
      "Something went wrong, xStart === yStart but no other condition matched"
    )
  }

  if (xStart < yStart) {
    if (xEnd < yStart) return EIA.BEFORE

    if (xEnd === yStart) return EIA.MEETS

    if (xEnd === yEnd) {
      if (yStart > xMiddle) return EIA.FINISHES_LESS_INV
      if (yStart < xEnd) return EIA.FINISHES_MOST_INV
      throw new Error(
        "Something went wrong, xStart < yStart adn xEnd === yEnd, but no other condition matched"
      )
    }
  }

  throw new Error("Not yet implemented")
}
