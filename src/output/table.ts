/* eslint-disable unicorn/prefer-add-event-listener */
import { ABObject } from "objects/angryBirdsObject"
import { tableStore } from "stores/table"
import { redrawObjects, updateCenter } from "."

/**
 * Updates the table to reflect the given objects
 *
 * Sets up event handler to allow for changing properties of the object if
 * exactly one object is given
 *
 * @param objs - (multiple) objects that should be reflected in the table
 */
export function updateTable(...objs: ABObject[]): void {
  const isMultiple = objs.length > 1

  const $tableElements = tableStore.get()
  if (!$tableElements)
    throw new Error("Cannot update Table as it has not yet been set up")

  if (isMultiple) {
    $tableElements.id.textContent =
      "[" + String(objs.map((object) => object.id)) + "]"
    disableInputs()
    return
  }

  const [object] = objs

  if (!object) {
    $tableElements.id.textContent = "Nothing"
    disableInputs()
    return
  }

  enableInputs()

  $tableElements.id.textContent = object.id
  $tableElements.x.value = String(object.x)
  $tableElements.x.onchange = (event) => {
    const newX = Number.parseFloat((event.target as HTMLInputElement)?.value)
    object.moveTo({ x: newX, y: object.y })
    redrawObjects([object])
    updateCenter([object])
  }

  $tableElements.y.value = String(object.y)
  $tableElements.y.onchange = (event) => {
    const newY = Number.parseFloat((event.target as HTMLInputElement)?.value)
    object.moveTo({ x: object.x, y: newY })
    redrawObjects([object])
    updateCenter([object])
  }

  $tableElements.s.value = String(object.scale)
  $tableElements.s.onchange = (event) => {
    object.setScale(
      Number.parseFloat((event.target as HTMLInputElement)?.value)
    )
    redrawObjects([object])
    updateCenter([object])
  }

  let oldRotation: number =
    object.shape === "rect" ? (object.params[2] as number) : 0
  $tableElements.a.value = String(oldRotation)
  $tableElements.a.onchange = (event) => {
    const newRotation = Number.parseFloat(
      (event.target as HTMLInputElement)?.value
    )
    object.rotateBy(newRotation - oldRotation)
    oldRotation = newRotation

    redrawObjects([object])
  }
}

/**
 * Disable all inputs from $tableElements
 */
function disableInputs(): void {
  const $tableElements = tableStore.get()
  if (!$tableElements)
    throw new Error("Cannot update Table as it has not yet been set up")

  $tableElements.x.value = ""
  $tableElements.x.setAttribute("disabled", "true")
  $tableElements.y.value = ""
  $tableElements.y.setAttribute("disabled", "true")
  $tableElements.s.value = ""
  $tableElements.s.setAttribute("disabled", "true")
  $tableElements.a.value = ""
  $tableElements.a.setAttribute("disabled", "true")
}

/**
 * Enable all inputs from $tableElements
 */
function enableInputs(): void {
  const $tableElements = tableStore.get()
  if (!$tableElements)
    throw new Error("Cannot update Table as it has not yet been set up")

  $tableElements.x.removeAttribute("disabled")
  $tableElements.y.removeAttribute("disabled")
  $tableElements.s.removeAttribute("disabled")
  $tableElements.a.removeAttribute("disabled")
}
