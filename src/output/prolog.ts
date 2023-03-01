import { FALLBACK_COLOR } from "../objects/colors"
import { objectStore } from "../stores/objects"
import { sceneStore } from "../stores/scene"

/**
 * Constructs a new prolog file from the scene and current objects.
 *
 * Writes the content to the output field
 *
 * @param keepDerivedInformation - boolean indicating whether derived predicates that may not
 * be true anymore should still be included
 */
export function exportFile(
  $output: HTMLInputElement,
  keepDerivedInformation = false
): void {
  const scene = sceneStore.get()
  const predicates = [
    ...(scene?.commonPredicates ?? []),
    ...(keepDerivedInformation ? scene?.derivedPredicates ?? [] : []),
  ]

  for (const object of objectStore.get()) {
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

    if (!object.isBird && object.material !== undefined) {
      predicates.push(
        `hasMaterial(${object.id}, ${object.material ?? "purple"}, 1, 1, 1, 1).`
        // TODO: What are the other values in the hasMaterial predicate?
      )
    }

    predicates.push(
      `shape(${object.id}, ${object.shape}, ${object.x}, ${
        object.y
      }, ${object.getArea()}, ${JSON.stringify(object.params)}).`
    )
  }

  const text = predicates.sort((a, b) => a.localeCompare(b)).join("\n")

  $output.value = text
}
