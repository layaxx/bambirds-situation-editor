import { setUpEventHandlers } from "canvasEventHandler"
import type { ABObject } from "objects/angryBirdsObject"
import { redrawAll, redrawObjects, updateCenter } from "output"
import { setUpGroups } from "output/svg"
import { updateTable } from "output/table"
import {
  objectStore,
  selectedObjectStore,
  makeBackup,
  previousSelectedObjectStore,
} from "stores/objects"
import { selectionMetaStore } from "stores/selection"
import { svgStore } from "stores/svgElements"
import { tableStore } from "stores/table"
import { setupScaling } from "./scaling"

export default function setupEditor($container: HTMLElement) {
  tableStore.set({
    id: document.querySelector("#selected-object-id")!,
    x: document.querySelector("#selected-object-x")!,
    y: document.querySelector("#selected-object-y")!,
    s: document.querySelector("#selected-object-s")!,
    a: document.querySelector("#selected-object-a")!,
  })

  svgStore.set(setUpGroups($container))

  setupScaling($container)

  setUpEventHandlers($container)

  objectStore.subscribe((objects: ABObject[]) => {
    redrawAll(objects)
  })
  selectedObjectStore.subscribe((objects: ABObject[]) => {
    if (objects.length > 0) makeBackup()
    redrawObjects(selectedObjectStore.get(), previousSelectedObjectStore.get())
    updateCenter(selectedObjectStore.get())
    updateTable(...selectedObjectStore.get())

    selectionMetaStore.set({
      scale:
        objects.length === 0
          ? 1
          : objects.reduce(
              (accumulator, current) => accumulator + current.scale,
              0
            ) / objects.length,
    })

    previousSelectedObjectStore.set(objects)
  })
}
