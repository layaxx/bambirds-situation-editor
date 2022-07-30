import { $svgElements, scene, selectedObjects } from "../app"
import { IObject } from "../types"
import { drawHorizontalLine, drawShape, showCenter } from "./svg"
import { updateTable } from "./table"

export function redrawAll(objects: IObject[]) {
  console.log(objects.length)
  $svgElements.$groupObjects.replaceChildren()

  drawHorizontalLine(scene.groundY)
  objects.forEach((object) => {
    drawShape(object)
  })
  updateTable(...selectedObjects)
}

export function removeObjects(objects: IObject[]) {
  objects.forEach((object) => {
    removeObject(object)
  })
}

function removeObject(object: IObject) {
  try {
    const toBeRemoved = $svgElements.$groupObjects.querySelector(
      "#svg-" + object.id
    )
    if (toBeRemoved !== null) {
      toBeRemoved.remove()
    }
  } catch {}
}

export function redrawObjects(
  selectedObjects: IObject[],
  unselectedObjects: IObject[] = []
) {
  for (const object of [...selectedObjects, ...unselectedObjects]) {
    removeObject(object)
    drawShape(object)
  }
}

export function updateCenter(objects: IObject[]) {
  try {
    const toBeRemoved = $svgElements.$groupOverlay.querySelector("#svg-center")
    if (toBeRemoved !== null) {
      toBeRemoved.remove()
    }

    showCenter(objects)
  } catch {}
}
