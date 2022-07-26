/* eslint-disable unicorn/prefer-add-event-listener */
import { ABObject } from "../objects/angryBirdsObject"
import { $tableElements } from "../app"
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

  if (isMultiple) {
    $tableElements.id.textContent = "Multiple Objects selected"
    disableInputs()
    return
  }

  const [object] = objs

  if (!object) {
    $tableElements.id.textContent = "None selected"
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
  $tableElements.x.removeAttribute("disabled")
  $tableElements.y.removeAttribute("disabled")
  $tableElements.s.removeAttribute("disabled")
  $tableElements.a.removeAttribute("disabled")
}
