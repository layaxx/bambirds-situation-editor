import { $tableElements } from "../app"
import { IObject } from "../types"
import { scaleObjectInternal } from "../objects/helper"
import { redrawObjects, updateCenter } from "."

export function updateTable(...objs: IObject[]) {
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
  $tableElements.x.addEventListener("change", (event) => {
    object.x = Number.parseFloat((event.target as HTMLInputElement)?.value)
    redrawObjects([object])
    updateCenter([object])
  })
  $tableElements.y.value = String(object.y)
  $tableElements.y.addEventListener("change", (event) => {
    object.y = Number.parseFloat((event.target as HTMLInputElement)?.value)
    redrawObjects([object])
    updateCenter([object])
  })
  $tableElements.s.value = String(object.scale)
  $tableElements.s.addEventListener("change", (event) => {
    object.scale = Number.parseFloat((event.target as HTMLInputElement)?.value)
    scaleObjectInternal(object)
    redrawObjects([object])
    updateCenter([object])
  })
  $tableElements.a.value = String(
    object.shape === "rect" ? object.params[2] : ""
  )
  $tableElements.a.addEventListener("change", (event) => {
    if (!object.params || object.params[2] === undefined) {
      console.error("Cannot rotate Object", object)
      return
    }

    object.params[2] = Number.parseFloat(
      (event.target as HTMLInputElement)?.value
    )

    redrawObjects([object])
  })
}

function disableInputs() {
  $tableElements.x.value = ""
  $tableElements.x.setAttribute("disabled", "true")
  $tableElements.y.value = ""
  $tableElements.y.setAttribute("disabled", "true")
  $tableElements.s.value = ""
  $tableElements.s.setAttribute("disabled", "true")
  $tableElements.a.value = ""
  $tableElements.a.setAttribute("disabled", "true")
}

function enableInputs() {
  $tableElements.x.removeAttribute("disabled")
  $tableElements.y.removeAttribute("disabled")
  $tableElements.s.removeAttribute("disabled")
  $tableElements.a.removeAttribute("disabled")
}
