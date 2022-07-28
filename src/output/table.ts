import { redrawObjects } from "."
import { $tableElements } from "../app"
import { IObject } from "../objects/types"
import { _scaleObject } from "../objects/helper"

export function updateTable(...objs: IObject[]) {
  const isMultiple = objs.length > 1

  if (isMultiple) {
    $tableElements.id.innerText = "Multiple Objects selected"
    disableInputs()
    return
  }

  const [object] = objs

  if (!object) {
    $tableElements.id.innerText = "None selected"
    disableInputs()
    return
  }

  enableInputs()

  $tableElements.id.innerText = object.id
  $tableElements.x.value = "" + object.x
  $tableElements.x.onchange = (event) => {
    object.x = parseFloat((event.target as HTMLInputElement)?.value)
    redrawObjects([object])
  }
  $tableElements.y.value = "" + object.y
  $tableElements.y.onchange = (event) => {
    object.y = parseFloat((event.target as HTMLInputElement)?.value)
    redrawObjects([object])
  }
  $tableElements.s.value = "" + object.scale
  $tableElements.s.onchange = (event) => {
    object.scale = parseFloat((event.target as HTMLInputElement)?.value)
    _scaleObject(object)
    redrawObjects([object])
  }
  $tableElements.a.value =
    "" + (object.shape === "rect" ? object.params[2] : "")
  $tableElements.a.onchange = (event) => {
    if (!object.params || object.params[2] === undefined) {
      console.error("Cannot rotate Object", object)
      return
    }
    object.params[2] = parseFloat((event.target as HTMLInputElement)?.value)

    redrawObjects([object])
  }
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
