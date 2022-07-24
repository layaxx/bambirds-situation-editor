import { redrawObjects } from "."
import { $tableElements } from "../app"
import { IObject } from "../objects/data"
import { _scaleObject } from "../objects/helper"

export function updateTable(obj?: IObject) {
  $tableElements.id.innerText = (obj && obj.id) || "None selected"
  $tableElements.x.value = "" + (obj ? obj.x : "")
  $tableElements.x.onchange = (event) => {
    if (!obj) return
    obj.x = parseFloat((event.target as HTMLInputElement)?.value)
    redrawObjects(obj)
  }
  $tableElements.y.value = "" + (obj ? obj.y : "")
  $tableElements.y.onchange = (event) => {
    if (!obj) return
    obj.y = parseFloat((event.target as HTMLInputElement)?.value)
    redrawObjects(obj)
  }
  $tableElements.s.value = "" + (obj ? obj.scale : "")
  $tableElements.s.onchange = (event) => {
    if (!obj) return
    obj.scale = parseFloat((event.target as HTMLInputElement)?.value)
    _scaleObject(obj)
    redrawObjects(obj)
  }
  $tableElements.a.value =
    "" + (obj && obj.shape === "rect" ? obj.params[2] : "")
  $tableElements.a.onchange = (event) => {
    if (!obj) return
    if (!obj.params || obj.params[2] === undefined) {
      console.error("Cannot rotate Object", obj)
      return
    }

    obj.params[2] = parseFloat((event.target as HTMLInputElement)?.value)

    redrawObjects(obj)
  }
}
