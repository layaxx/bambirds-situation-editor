import { $container, objects, scene, selectedObject } from "../app"
import { IObject } from "../objects/data"
import { drawGrid, drawHorizontalLine, drawShape } from "./svg"
import { updateTable } from "./table"

export function redrawAll() {
  while ($container.lastChild) {
    $container.removeChild($container.lastChild)
  }
  drawGrid()
  drawHorizontalLine(scene.groundY)
  objects.forEach(drawShape)
  updateTable(selectedObject)
}

export function redrawObjects(...objects: (IObject | undefined)[]) {
  for (var object of objects) {
    if (!object) continue
    try {
      const toBeRemoved = document.querySelector("#svg-" + object.id)
      if (toBeRemoved !== null) {
        $container.removeChild(toBeRemoved)
      }
    } catch {}
    drawShape(object)
  }
  updateTable(objects[objects.length - 1])
}
