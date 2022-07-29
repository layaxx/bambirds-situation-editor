import { $svgElements, scene, selectedObjects } from "../app"
import { IObject } from "../objects/types"
import { drawHorizontalLine, drawShape, showCenter } from "./svg"
import { updateTable } from "./table"

export function redrawAll(objects: IObject[]) {
  console.log(objects.length)
  $svgElements.$groupObjects.replaceChildren()

  drawHorizontalLine(scene.groundY)
  objects.forEach(drawShape)
  updateTable(...selectedObjects)
}

export function removeObjects(objects: IObject[]) {
  objects.forEach(removeObject)
}

function removeObject(object: IObject) {
  try {
    const toBeRemoved = $svgElements.$groupObjects.querySelector(
      "#svg-" + object.id
    )
    if (toBeRemoved !== null) {
      $svgElements.$groupObjects.removeChild(toBeRemoved)
    }
  } catch {}
}

export function redrawObjects(
  selectedObjects: IObject[],
  unselectedObjects: IObject[] = []
) {
  for (var object of [...selectedObjects, ...unselectedObjects]) {
    removeObject(object)
    drawShape(object)
  }
}

export function updateCenter(objects: IObject[]) {
  try {
    const toBeRemoved = $svgElements.$groupOverlay.querySelector("#svg-center")
    if (toBeRemoved !== null) {
      $svgElements.$groupOverlay.removeChild(toBeRemoved)
    }
    showCenter(objects)
  } catch {}
}
