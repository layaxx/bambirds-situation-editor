import {
  selectedObjects,
  objects,
  updateSelectedObjects,
  selectionMeta,
  getUID,
} from "../app"
import {
  getCenterFromObjects,
  handleScaleObject,
  handleMoveObject,
  _scaleObject,
  translatePolyObject,
} from "../objects/helper"
import { removeObjects, redrawObjects, updateCenter } from "../output"
import { updateTable } from "../output/table"
import { IObject } from "../types"

export function setUpKeyboardEventHandlers() {
  document.addEventListener("keydown", handleKeyPress)

  function handleKeyPress(event: KeyboardEvent) {
    if (
      new Set(["TEXTAREA", "INPUT"]).has((event.target as HTMLElement)?.tagName)
    ) {
      return
    }
    event.preventDefault()
    if (!selectedObjects.length) {
      return
    }
    switch (event.key) {
      case "Delete":
        const indicesToBeDeleted: number[] = []

        objects.forEach((obj, index) => {
          if (selectedObjects.includes(obj)) indicesToBeDeleted.push(index)
        })

        const hasBeenDeleted: IObject[] = []

        indicesToBeDeleted
          .reverse()
          .forEach((index) => hasBeenDeleted.push(...objects.splice(index, 1)))

        updateSelectedObjects([])
        removeObjects(hasBeenDeleted) // needed because updateSelectedObjects() draws old objects that should have been deleted
        break
      case "ArrowLeft":
      case "ArrowRight":
        if (event.altKey) {
          // Rotate
          const offset = 0.01 * (event.ctrlKey ? 10 : 1)
          const angle = event.key === "ArrowRight" ? +offset : -offset
          const center = getCenterFromObjects(selectedObjects)
          // rotate center of objects
          selectedObjects.forEach((object) => {
            const vector = { x: object.x - center.x, y: object.y - center.y }

            object.x =
              center.x + Math.cos(angle) * vector.x - Math.sin(angle) * vector.y
            object.y =
              center.y + Math.sin(angle) * vector.x + Math.cos(angle) * vector.y

            if (object.shape === "poly") {
              const [first, ...rest] = object.vectors
              object.vectors = [
                first,
                ...rest.map((input): [number, number] => {
                  if (typeof input === "number") {
                    return [1, 1]
                  }
                  const [x1, y1] = input
                  const newX = Math.cos(angle) * x1 - Math.sin(angle) * y1
                  const newY = Math.sin(angle) * x1 + Math.cos(angle) * y1

                  return [newX, newY]
                }),
              ]
              _scaleObject(object)
            } else if (object.shape == "ball") {
              // dont need to rotate balls
            } else if (!object.params || object.params[2] === undefined) {
              console.error("Cannot rotate invalid object", object)
            } else {
              switch (event.key) {
                case "ArrowLeft":
                  ;(object.params[2] as number) -= offset
                  break
                case "ArrowRight":
                  ;(object.params[2] as number) += offset
                  break
              }
            }
          })

          selectionMeta.center = getCenterFromObjects(selectedObjects)

          redrawObjects(selectedObjects)
          updateTable(...selectedObjects)
          updateCenter(selectedObjects) // TODO: Why does the center change??
          break
        }
      case "ArrowUp":
      case "ArrowDown":
        if (event.altKey) {
          // Scale
          selectionMeta.scale += event.key === "ArrowUp" ? +0.1 : -0.1
          selectedObjects.forEach((obj, index) => {
            const center = selectionMeta.center
            if (selectedObjects.length > 1) {
              obj.x =
                center.x + selectionMeta.scale * selectionMeta.vectors[index].x
              obj.y =
                center.y + selectionMeta.scale * selectionMeta.vectors[index].y
            }
            handleScaleObject(obj, event.key, event.ctrlKey)
          })
        } else {
          // Move
          selectedObjects.forEach((obj) =>
            handleMoveObject(obj, event.key, event.ctrlKey)
          )
        }
        selectionMeta.center = getCenterFromObjects(selectedObjects)
        updateTable(...selectedObjects)
        redrawObjects(selectedObjects)
        updateCenter(selectedObjects)
        break
      case "d":
        if (event.ctrlKey) {
          const newObject = {
            ...selectedObjects[0],
            id: selectedObjects[0].id + "d" + getUID(),
          }
          objects.push(newObject)
          redrawObjects(selectedObjects, [newObject])
        }
        break
    }
  }
}
