import { $output, objects, scene } from "../app"
import { FALLBACK_COLOR } from "../objects/colors"
import { getArea } from "../objects/helper"

/**
 * Constructs a new prolog file from the scene and current objects.
 *
 * Writes the content to the output field
 *
 * @param keepDerivedInformation - boolean indicating whether derived predicates that may not
 * be true anymore should still be included
 */
export function exportFile(keepDerivedInformation = false): void {
  const predicates = [
    ...scene.commonPredicates,
    ...(keepDerivedInformation ? scene.derivedPredicates : []),
  ]

  for (const object of objects) {
    if (object.isPig) {
      predicates.push(`pig(${object.id}, 1, 1, 1, 1).`)
    }

    if (object.isBird) {
      if (!object.color) {
        console.warn("No color defined; using fallback", object)
      }

      predicates.push(
        `bird(${object.id}).`,
        `hasColor(${object.id}, ${object.color ?? FALLBACK_COLOR}).`
      )
    }

    if (!(object.isBird || object.isPig)) {
      predicates.push(`hasForm(${object.id}, ${object.form ?? "cube"}).`)
    }

    if (!object.isBird) {
      predicates.push(
        `hasMaterial(${object.id}, ${object.material ?? "purple"}, 1, 1, 1, 1).`
      )
    }

    predicates.push(
      `shape(${object.id}, ${object.shape}, ${object.x}, ${object.y}, ${getArea(
        object
      )}, ${JSON.stringify(object.params)}).`
    )
  }

  const text = predicates.sort((a, b) => a.localeCompare(b)).join("\n")

  $output.value = text
}
