/* eslint-disable unicorn/prefer-add-event-listener */
import { $tableElements } from "../app"
import { IObject } from "../types"
import { scaleObjectInternal, translatePolyObject } from "../objects/helper"
import { redrawObjects, updateCenter } from "."

/**
 * Updates the table to reflect the given objects
 *
 * Sets up event handler to allow for changing properties of the object if
 * exactly one object is given
 *
 * @param objs - (multiple) objects that should be reflected in the table
 */
export function updateTable(...objs: IObject[]): void {
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
    const xOffset = object.x - newX
    object.x = newX
    if (object.shape === "poly") translatePolyObject(object, xOffset, 0)
    redrawObjects([object])
    updateCenter([object])
  }

  $tableElements.y.value = String(object.y)
  $tableElements.y.onchange = (event) => {
    const newY = Number.parseFloat((event.target as HTMLInputElement)?.value)
    const yOffset = object.y - newY
    object.y = newY
    if (object.shape === "poly") translatePolyObject(object, 0, yOffset)
    redrawObjects([object])
    updateCenter([object])
  }

  $tableElements.s.value = String(object.scale)
  $tableElements.s.onchange = (event) => {
    object.scale = Number.parseFloat((event.target as HTMLInputElement)?.value)
    scaleObjectInternal(object)
    redrawObjects([object])
    updateCenter([object])
  }

  $tableElements.a.value = String(
    object.shape === "rect" ? object.params[2] : ""
  )
  $tableElements.a.onchange = (event) => {
    if (
      !object.params ||
      object.params[2] === undefined ||
      object.shape === "poly"
    ) {
      console.error("Cannot rotate Object", object)
      return
    }

    object.params[2] = Number.parseFloat(
      (event.target as HTMLInputElement)?.value
    )

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
