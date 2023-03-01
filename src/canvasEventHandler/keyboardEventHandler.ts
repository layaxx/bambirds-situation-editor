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
import { getUID } from "../stores/ids"
import {
  objectStore,
  recoverBackup,
  selectedObjectStore,
} from "../stores/objects"
import { selectionMetaStore } from "../stores/selection"
import { svgStore } from "../stores/svgElements"

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

  // eslint-disable-next-line complexity
  function handleKeyPress(event: KeyboardEvent): void {
    if (
      new Set(["TEXTAREA", "INPUT"]).has((event.target as HTMLElement)?.tagName)
    ) {
      return
    }

    if (event.key === "z" && event.ctrlKey) {
      recoverBackup()
      return
    }

    if (selectedObjectStore.get().length === 0) {
      if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
      ) {
        event.preventDefault()

        const offset = 5
        let offsetX = 0
        let offsetY = 0

        // eslint-disable-next-line default-case
        switch (event.key) {
          case "ArrowLeft":
            offsetX = -offset
            break
          case "ArrowRight":
            offsetX = offset
            break
          case "ArrowUp":
            offsetY = -offset
            break
          case "ArrowDown":
            offsetY = offset
            break
        }

        const svg = svgStore.get()?.$svg
        const style = svg?.getAttribute("style")
        const regex = /transform-origin:\s*(-?\d+)% (-?\d+)%/

        if (style?.includes("transform-origin:")) {
          const result = regex.exec(style)
          if (result && result.length >= 3) {
            svg?.setAttribute(
              "style",
              (style ?? "").replace(
                regex,
                `transform-origin: ${
                  Number.parseInt(result[1], 10) + offsetX
                }% ${Number.parseInt(result[2], 10) + offsetY}%`
              )
            )
            return
          }
        }

        console.log("style")
        svg?.setAttribute(
          "style",
          (style ?? "") +
            (style?.endsWith(";") ? "" : ";") +
            `transform-origin: ${50 + offsetX}% ${50 + offsetY}%;`
        )
      }

      return
    }

    event.preventDefault()

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
          handleMoveObject(event.key, event.ctrlKey)
        }

        updateTable(...selectedObjectStore.get())
        redrawObjects(selectedObjectStore.get())
        updateCenter(selectedObjectStore.get())

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

  for (const [index, object] of objectStore.get().entries()) {
    if (selectedObjectStore.get().includes(object))
      indicesToBeDeleted.push(index)
  }

  const hasBeenDeleted: ABObject[] = []

  for (const index of indicesToBeDeleted.reverse())
    hasBeenDeleted.push(...objectStore.get().splice(index, 1))

  selectedObjectStore.set([])
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
  const center = getCenterFromObjects(selectedObjectStore.get())
  // Rotate center of objects
  for (const object of selectedObjectStore.get()) {
    const vectorToCenter = getVectorBetween(object, center)
    const newPosition = addVectors(center, rotateVector(vectorToCenter, angle))
    object.moveTo(newPosition)

    object.rotateBy(angle)
  }

  redrawObjects(selectedObjectStore.get())
  updateTable(...selectedObjectStore.get())
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
  const max = ctrlKey ? 10 : 1
  for (let i = 0; i < max; i++) {
    // This loop is a fix because multiplying offset by ten did not work very well

    let offset = 0.1

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

    const oldScale = selectionMetaStore.get().scale
    if (oldScale + offset < 0.1) {
      console.error("You are not allowed to scale to below 0.1")
      return
    }

    const newScale = oldScale + offset
    selectionMetaStore.set({
      ...selectedObjectStore.get(),
      scale: newScale,
    })

    for (const object of selectedObjectStore.get()) {
      const center = getCenterFromObjects(selectedObjectStore.get())
      if (selectedObjectStore.get().length > 1) {
        object.moveTo(
          addVectors(
            center,
            scaleVector(
              scaleVector(getVectorBetween(object, center), 1 / oldScale),
              newScale
            )
          )
        )
      }

      object.setScale(object.scale + offset)
    }
  }
}

/**
 * Adds copies of all selected objects to list of all objects
 *
 */
function handleDuplicate(): void {
  const newObjects: ABObject[] = []

  selectedObjectStore.get().forEach((object) => {
    const newObject = object.clone(`${object.id}d${getUID()}`)
    newObjects.push(newObject)
  })
  objectStore.set([...objectStore.get(), ...newObjects])
  redrawObjects(selectedObjectStore.get(), newObjects)
}

/**
 * Handles the movement of a selected objects considering the given key presses.
 *
 * Valid keys are the arrow keys, which correspond to the appropriate movement of the object,
 * i.e. "ArrowUp" moves the object up, etc.
 *
 * Objects are moved 1 or 10 pixels in the appropriate direction, depending on the truthiness
 * of isHighSpeed
 *
 * @param key - key corresponding to the direction in which the selected objects are moved
 * @param isHighSpeed - increases movement speed tenfold iff true
 */
function handleMoveObject(key: string, isHighSpeed?: boolean): void {
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

  for (const object of selectedObjectStore.get()) {
    object.moveBy({ x: xOffset, y: yOffset })
  }
}
