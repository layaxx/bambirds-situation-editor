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
  getVectorBetween,
} from "../objects/helper"
import { removeObjects, redrawObjects, updateCenter } from "../output"
import { updateTable } from "../output/table"
import { IObject } from "../types"

/**
 * Sets up global key press listeners and appropriate event handlers to enable
 * keyboard navigation.
 *
 * Available keys are Arrow Keys, Delete and "d"
 *
 * Available modifiers are Ctrl and Alt
 *
 * Event handlers do not run when any input or textarea element is selected
 */
export function setUpKeyboardEventHandlers(): void {
  document.addEventListener("keydown", handleKeyPress)

  function handleKeyPress(event: KeyboardEvent): void {
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

      case "ArrowUp": // eslint-disable-line no-fallthrough
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
        if (event.ctrlKey) {
          handleDuplicate()
        }

        break
      default:
    }
  }
}

/**
 * Deletes all currently selected objects from the list of all objects
 */
function handleDelete(): void {
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

/**
 * Handles the rotation of (multiple) selected objects corresponding to the given keys.
 *
 * "ArrowLeft" causes counter-clock-wise rotation, "ArrowRight" clock-wise rotation.
 *
 * Speed of rotation is increased tenfold iff ctrlKey is true
 *
 * @param key - key corresponding to direction of rotation
 * @param ctrlKey - whether speed shall be increased tenfold
 */
function handleRotate(key: string, ctrlKey: boolean): void {
  // Rotate
  const offset = 0.01 * (ctrlKey ? 10 : 1)
  const angle = key === "ArrowRight" ? Number(offset) : -offset
  const center = getCenterFromObjects(selectedObjects)
  // Rotate center of objects
  for (const object of selectedObjects) {
    const vector = getVectorBetween(object, center)

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
  // Not needed: updateCenter(selectedObjects): center does not change when rotating
}

/**
 * Allows for the scaling of all selected objects in combination.
 *
 * Translates the centers of the selectedObjects and then rotates each object.
 *
 * @param key - "ArrowUp" to increase scale, "ArrowDown" to decrease it
 * @param ctrlKey - increases speed of scaling tenfold iff true
 */
function handleScale(key: string, ctrlKey: boolean): void {
  const offset = 0.1 * (ctrlKey ? 10 : 1)

  selectionMeta.scale += key === "ArrowUp" ? offset : -offset
  for (const [index, object] of selectedObjects.entries()) {
    const center = selectionMeta.center
    if (selectedObjects.length > 1) {
      object.x = center.x + selectionMeta.scale * selectionMeta.vectors[index].x
      object.y = center.y + selectionMeta.scale * selectionMeta.vectors[index].y
    }

    handleScaleObject(object, key, ctrlKey)
  }
}

/**
 * Adds copies of all selected objects to list of all objects
 *
 */
function handleDuplicate(): void {
  const newObjects: IObject[] = []

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
