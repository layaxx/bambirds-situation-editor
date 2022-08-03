import {
  $svgElements,
  scene,
  selectedObjects,
  updateSelectedObjects,
} from "../app"
import { IObject } from "../types"
import { drawHorizontalLine, drawShape, showCenter } from "./svg"
import { updateTable } from "./table"

export function redrawAll(objects: IObject[]) {
  $svgElements.$groupObjects.replaceChildren()

  drawHorizontalLine(scene.groundY)
  objects.forEach((object) => {
    drawShape(
      object,
      $svgElements.$groupObjects,
      clickEventListenerFactory(object)
    )
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
    drawShape(
      object,
      $svgElements.$groupObjects,
      clickEventListenerFactory(object)
    )
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

function clickEventListenerFactory(
  object: IObject
): (this: SVGElement, ev: MouseEvent) => any {
  return (event) => {
    const indexIfSelected = selectedObjects.indexOf(object)

    if (event.ctrlKey) {
      if (indexIfSelected === -1) {
        // Add to selection
        updateSelectedObjects([...selectedObjects, object])
        console.log("add Object to selection")
      } else {
        // Deselect
        updateSelectedObjects(
          selectedObjects.filter((selectedObject) => selectedObject !== object)
        )
        console.log("deselect Object")
      }
    } else {
      if (indexIfSelected !== -1) return
      updateSelectedObjects([object])
    }
  }
}
