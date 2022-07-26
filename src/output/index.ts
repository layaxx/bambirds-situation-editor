import {
  $svgElements,
  scene,
  selectedObjects,
  updateSelectedObjects,
} from "../app"
import { ABObject } from "../objects/angryBirdsObject"
import { drawGrid, drawHorizontalLine, showCenter } from "./svg"
import { updateTable } from "./table"

export function redrawAll(objects: ABObject[]): void {
  $svgElements.$groupObjects.replaceChildren()
  $svgElements.$groupBackground.replaceChildren()

  drawGrid()

  drawHorizontalLine(scene.groundY, $svgElements.$groupBackground)
  objects.forEach((object) => {
    object.render(
      $svgElements.$groupObjects,
      selectedObjects.includes(object),
      clickEventListenerFactory(object)
    )
  })
  updateTable(...selectedObjects)
}

export function removeObjects(objects: ABObject[]): void {
  objects.forEach((object) => {
    removeObject(object)
  })
}

function removeObject(object: ABObject): void {
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
  selectedObjects: ABObject[],
  unselectedObjects: ABObject[] = []
): void {
  for (const object of [...selectedObjects, ...unselectedObjects]) {
    removeObject(object)
    object.render(
      $svgElements.$groupObjects,
      selectedObjects.includes(object),
      clickEventListenerFactory(object)
    )
  }
}

export function updateCenter(objects: ABObject[]): void {
  try {
    const toBeRemoved = $svgElements.$groupOverlay.querySelector("#svg-center")
    if (toBeRemoved !== null) {
      toBeRemoved.remove()
    }

    showCenter(objects)
  } catch {}
}

function clickEventListenerFactory(
  object: ABObject
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
