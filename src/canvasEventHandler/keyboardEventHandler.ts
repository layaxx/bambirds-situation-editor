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
  scaleObjectInternal,
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
    if (selectedObjects.length === 0) {
      return
    }

    switch (event.key) {
      case "Delete":
        handleDelete()
        break
      case "ArrowLeft":
      case "ArrowRight":
        if (event.altKey) {
          handleRotate(event.key, event.ctrlKey)
          break
        }

      // eslint-disable-next-line no-fallthrough
      case "ArrowUp":
      case "ArrowDown":
        if (event.altKey) {
          // Scale
          handleScale(event.key, event.ctrlKey)
        } else {
          // Move
          for (const object of selectedObjects) {
            handleMoveObject(object, event.key, event.ctrlKey)
          }
        }

        selectionMeta.center = getCenterFromObjects(selectedObjects)
        updateTable(...selectedObjects)
        redrawObjects(selectedObjects)
        updateCenter(selectedObjects)
        break
      case "d":
        handleDuplicate(event.ctrlKey)
        break
      default:
    }
  }
}

function handleDelete() {
  const indicesToBeDeleted: number[] = []

  for (const [index, object] of objects.entries()) {
    if (selectedObjects.includes(object)) indicesToBeDeleted.push(index)
  }

  const hasBeenDeleted: IObject[] = []

  for (const index of indicesToBeDeleted.reverse())
    hasBeenDeleted.push(...objects.splice(index, 1))

  updateSelectedObjects([])
  removeObjects(hasBeenDeleted) // Needed because updateSelectedObjects() draws old objects that should have been deleted
}

function handleRotate(key: string, ctrlKey: boolean) {
  // Rotate
  const offset = 0.01 * (ctrlKey ? 10 : 1)
  const angle = key === "ArrowRight" ? Number(offset) : -offset
  const center = getCenterFromObjects(selectedObjects)
  // Rotate center of objects
  for (const object of selectedObjects) {
    const vector = { x: object.x - center.x, y: object.y - center.y }

    object.x =
      center.x + Math.cos(angle) * vector.x - Math.sin(angle) * vector.y
    object.y =
      center.y + Math.sin(angle) * vector.x + Math.cos(angle) * vector.y

    if (object.shape === "poly") {
      const [first, ...rest] = object.vectors ?? [-1]
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
      scaleObjectInternal(object)
    } else if (object.shape === "ball") {
      // Dont need to rotate balls
    } else if (!object.params || object.params[2] === undefined) {
      console.error("Cannot rotate invalid object", object)
    } else {
      switch (key) {
        case "ArrowLeft":
          ;(object.params[2] as number) -= offset
          break
        case "ArrowRight":
          ;(object.params[2] as number) += offset
          break
        default:
      }
    }
  }

  selectionMeta.center = getCenterFromObjects(selectedObjects)

  redrawObjects(selectedObjects)
  updateTable(...selectedObjects)
  updateCenter(selectedObjects) // TODO: Why does the center change??
}

function handleScale(key: string, ctrlKey: boolean) {
  selectionMeta.scale += key === "ArrowUp" ? +0.1 : -0.1
  for (const [index, object] of selectedObjects.entries()) {
    const center = selectionMeta.center
    if (selectedObjects.length > 1) {
      object.x = center.x + selectionMeta.scale * selectionMeta.vectors[index].x
      object.y = center.y + selectionMeta.scale * selectionMeta.vectors[index].y
    }

    handleScaleObject(object, key, ctrlKey)
  }
}

function handleDuplicate(ctrlKey: boolean) {
  const newObjects: IObject[] = []
  if (ctrlKey) {
    selectedObjects.forEach((object) => {
      const newObject = {
        ...(JSON.parse(JSON.stringify(object)) as IObject),
        id: `${object.id}d${getUID()}`,
      }
      newObjects.push(newObject)
    })
    objects.push(...newObjects)
    redrawObjects(selectedObjects, newObjects)
  }
}
