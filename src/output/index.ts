import { $svgElements, objects, scene, selectedObject } from "../app"
import { IObject } from "../objects/data"
import { drawHorizontalLine, drawShape } from "./svg"
import { updateTable } from "./table"

export function redrawAll() {
  $svgElements.$groupObjects.replaceChildren()

  drawHorizontalLine(scene.groundY)
  objects.forEach(drawShape)
  updateTable(selectedObject)
}

export function redrawObjects(...objects: (IObject | undefined)[]) {
  for (var object of objects) {
    if (!object) continue
    try {
      const toBeRemoved = $svgElements.$groupObjects.querySelector(
        "#svg-" + object.id
      )
      if (toBeRemoved !== null) {
        $svgElements.$groupObjects.removeChild(toBeRemoved)
      }
    } catch {}
    drawShape(object)
  }
  updateTable(objects[objects.length - 1])
}
