import { $output, objects, scene } from "../app"
import { FALLBACK_COLOR } from "../objects/colors"
import { getArea } from "../objects/helper"

export function exportFile(keepDerivedInformation = false) {
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
