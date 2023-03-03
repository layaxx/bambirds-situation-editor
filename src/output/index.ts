import type { ABObject } from "objects/angryBirdsObject"
import { selectedObjectStore } from "stores/objects"
import { sceneStore } from "stores/scene"
import { svgStore } from "stores/svgElements"
import { drawGrid, drawHorizontalLine, showCenter } from "./svg"

export function redrawAll(objects: ABObject[]): void {
  const $svgElements = svgStore.get()

  if (!$svgElements)
    throw new Error("Cannot redraw Objects because SVG is not set up")

  $svgElements.$groupObjects.replaceChildren()
  $svgElements.$groupBackground.replaceChildren()

  drawGrid()

  drawHorizontalLine(
    sceneStore.get()?.groundY ?? 0,
    $svgElements.$groupBackground
  )
  objects.forEach((object) => {
    object.render(
      $svgElements.$groupObjects,
      selectedObjectStore.get().includes(object),
      clickEventListenerFactory(object)
    )
  })
}

export function removeObjects(objects: ABObject[]): void {
  objects.forEach((object) => {
    removeObject(object)
  })
}

function removeObject(object: ABObject): void {
  try {
    const toBeRemoved = svgStore
      .get()
      ?.$groupObjects.querySelector("#svg-" + object.id)
    if (toBeRemoved) {
      toBeRemoved.remove()
    }
  } catch {}
}

export function redrawObjects(
  selectedObjects: ABObject[],
  unselectedObjects: ABObject[] = []
): void {
  const $svgElements = svgStore.get()
  if (!$svgElements)
    throw new Error("Cannot redraw Objects because SVG is not set up")
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
  const $svgElements = svgStore.get()
  if (!$svgElements)
    throw new Error("Cannot update Center because SVG is not set up")
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
    const indexIfSelected = selectedObjectStore.get().indexOf(object)

    if (event.ctrlKey) {
      if (indexIfSelected === -1) {
        // Add to selection
        selectedObjectStore.set([...selectedObjectStore.get(), object])
        console.log("add Object to selection")
      } else {
        // Deselect
        selectedObjectStore.set(
          selectedObjectStore
            .get()
            .filter((selectedObject) => selectedObject !== object)
        )
        console.log("deselect Object")
      }
    } else {
      if (indexIfSelected !== -1) return
      selectedObjectStore.set([object])
    }
  }
}
