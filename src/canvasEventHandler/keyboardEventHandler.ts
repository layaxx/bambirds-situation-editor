import {
  selectedObjects,
  objects,
  updateSelectedObjects,
  selectionMeta,
  getUID,
} from "../app"
import { ABObject } from "../objects/angryBirdsObject"
import {
  addVectors,
  getCenterFromObjects,
  getVectorBetween,
  rotateVector,
  scaleVector,
} from "../objects/helper"
import { removeObjects, redrawObjects, updateCenter } from "../output"
import { updateTable } from "../output/table"

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
          // Rotate
          handleRotate(event.key, event.ctrlKey)
          break
        }
      // Fallthrough is intended, needed for moving objects

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

  const hasBeenDeleted: ABObject[] = []

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
    const vectorToCenter = getVectorBetween(object, center)
    const newPosition = addVectors(center, rotateVector(vectorToCenter, angle))
    object.moveTo(newPosition)

    object.rotateBy(angle)
  }

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
  let offset = ctrlKey ? 1 : 0.1

  switch (key) {
    case "ArrowUp":
      // ArrowUp => Scaling Up => Offset is already correct
      break
    case "ArrowDown":
      // ArrowDown => Scaling Down => Offset needs to be negative
      offset *= -1
      break
    default:
      console.warn("Unknown scaling direction:", key, "ignoring.")
      return
  }

  const oldScale = selectionMeta.scale
  selectionMeta.scale += offset
  for (const object of selectedObjects) {
    const center = getCenterFromObjects(selectedObjects)
    if (selectedObjects.length > 1) {
      object.moveTo(
        addVectors(
          center,
          scaleVector(
            scaleVector(getVectorBetween(object, center), 1 / oldScale),
            selectionMeta.scale
          )
        )
      )
    }

    object.setScale(object.scale + offset)
  }
}

/**
 * Adds copies of all selected objects to list of all objects
 *
 */
function handleDuplicate(): void {
  const newObjects: ABObject[] = []

  selectedObjects.forEach((object) => {
    const newObject = object.clone(`${object.id}d${getUID()}`)
    newObjects.push(newObject)
  })
  objects.push(...newObjects)
  redrawObjects(selectedObjects, newObjects)
}

/**
 * Handles the movement of a given object considering the given key presses.
 *
 * Valid keys are the arrow keys, which correspond to the appropriate movement of the object,
 * i.e. "ArrowUp" moves the object up, etc.
 *
 * Objects are moved 1 or 10 pixels in the appropriate direction, depending on the truthiness
 * of isHighSpeed
 *
 * @param object - object that shall be moved
 * @param key - key corresponding to the direction in which the object is moved
 * @param isHighSpeed - increases movement speed tenfold iff true
 */
function handleMoveObject(
  object: ABObject,
  key: string,
  isHighSpeed?: boolean
): void {
  const offset = isHighSpeed ? 10 : 1
  let xOffset = 0
  let yOffset = 0
  switch (key) {
    case "ArrowUp":
      yOffset = -offset // Y = 0 is at the top
      break
    case "ArrowDown":
      yOffset = offset
      break
    case "ArrowLeft":
      xOffset = -offset
      break
    case "ArrowRight":
      xOffset = offset
      break
    default:
      console.log("Unknown moving direction:", key, "ignoring.")
      return
  }

  object.moveBy({ x: xOffset, y: yOffset })
}
