import { $output, objects, scene } from "../app"
import { getArea } from "../objects/helper"

export function exportFile(keepDerivedInformation = false) {
  const predicates = [
    ...scene.commonPredicates,
    ...(keepDerivedInformation ? scene.derivedPredicates : []),
  ]

  for (var obj of objects) {
    if (obj.isPig) {
      predicates.push(`pig(${obj.id}, 1, 1, 1, 1).`)
    }
    if (obj.isBird) {
      predicates.push(`bird(${obj.id}).`)
      predicates.push(`hasColor(${obj.id}, ${obj.color}).`)
    }
    if (!(obj.isBird || obj.isPig)) {
      predicates.push(`hasForm(${obj.id}, ${obj.form ?? "cube"}).`)
    }
    if (!obj.isBird) {
      predicates.push(
        `hasMaterial(${obj.id}, ${obj.material ?? "purple"}, 1, 1, 1, 1).`
      )
    }
    predicates.push(
      `shape(${obj.id}, ${obj.shape}, ${obj.x}, ${obj.y}, ${getArea(
        obj
      )}, ${JSON.stringify(obj.params)}).`
    )
  }

  const text = predicates.sort((a, b) => a.localeCompare(b)).join("\n")

  $output.value = text
}
