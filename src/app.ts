import { IObject } from "./objects/types"
import {
  getObjectsWithinBoundary,
  handleMoveObject,
  handleRotateObject,
  handleScaleObject,
  translatePolyObject,
} from "./objects/helper"
import { redrawAll, redrawObjects, removeObjects } from "./output"
import { exportFile } from "./output/prolog"
import {
  drawGrid,
  hideSelectionRectangle,
  initializeSelectionRectangle,
  setUpGroups,
  snapToGrid,
  updateSelectionRectangle,
} from "./output/svg"
import parse from "./parser/situationFileParser"
import { updateTable } from "./output/table"

var $input: HTMLInputElement
var $output: HTMLInputElement
var $svgElements: {
  $svg: HTMLElement
  $groupBackground: SVGElement
  $groupObjects: SVGElement
  $groupOverlay: SVGElement
}
var $keepPredicates: HTMLInputElement
var $tableElements: {
  id: HTMLElement
  x: HTMLInputElement
  y: HTMLInputElement
  s: HTMLInputElement
  a: HTMLInputElement
}
var objects: IObject[]
var selectedObjects: IObject[] = []
var scene: any

function init() {
  $input = document.getElementById("situationfile") as HTMLInputElement
  const $container = document.getElementById("container") as HTMLElement
  $output = document.getElementById("output") as HTMLInputElement
  if ($input === null || $container === null || $output === null) {
    console.error(
      "Failed to get required HTML Elements, missing at least one of $situationfile, $container, $output"
    )
    return
  }

  $keepPredicates = document.getElementById(
    "keepDerivedPredicates"
  ) as HTMLInputElement

  document.getElementById("exportButton")?.addEventListener("click", () => {
    exportFile($keepPredicates.checked)
  })

  $tableElements = {
    id: document.getElementById("selected-object-id") as HTMLElement,
    x: document.getElementById("selected-object-x") as HTMLInputElement,
    y: document.getElementById("selected-object-y") as HTMLInputElement,
    s: document.getElementById("selected-object-s") as HTMLInputElement,
    a: document.getElementById("selected-object-a") as HTMLInputElement,
  }
  if (
    $tableElements.id === null ||
    $tableElements.x === null ||
    $tableElements.y === null ||
    $tableElements.s === null ||
    $tableElements.a === null
  ) {
    console.error(
      "Failed to get output HTML Elements, missing at least one from selected Object Inputs"
    )
  }

  $svgElements = setUpGroups($container)

  // setup SVG background
  drawGrid()

  // Setup SVG Scaling
  const slider = document.getElementById("zoomRange") as HTMLInputElement | null
  const zoomValue = document.getElementById("zoomValue")
  if (slider === null) {
    console.error("Failed to setup SVG Scaling")
  } else {
    slider.oninput = function (event) {
      const value = parseFloat(
        (event.target as HTMLInputElement | null)?.value ?? "100"
      )
      if (zoomValue !== null) {
        zoomValue.innerText = `${value}%`
      }
      $container.style.transform = `scale(${value / 100})`
    }
  }

  setUpEventHandlers($container)

  const loadSituationFile = () => {
    const loadResult = parse($input.value)
    objects = loadResult.objects
    scene = loadResult.scene

    redrawAll(objects)
  }

  $input.onblur = () => loadSituationFile()
  loadSituationFile()
}

init()

function setUpEventHandlers(svg: HTMLElement) {
  /* CONTROLS */
  document.addEventListener("keydown", handleKeyPress)

  var count = 0
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

        removeObjects(hasBeenDeleted)
        selectedObjects = []
        updateTable(...selectedObjects)
        break
      case "ArrowLeft":
      case "ArrowRight":
        if (event.altKey) {
          // Rotate
          if (selectedObjects.length > 1) {
            console.warn(
              "Cannot currently correctly handle multiple selected objects"
            )
          }
          selectedObjects.forEach((obj) =>
            handleRotateObject(obj, event.key, event.ctrlKey)
          )
          updateTable(...selectedObjects)
          break
        }
      case "ArrowUp":
      case "ArrowDown":
        if (event.altKey) {
          // Scale
          if (selectedObjects.length > 1) {
            console.warn(
              "Cannot currently correctly handle multiple selected objects"
            )
          }
          selectedObjects.forEach((obj) =>
            handleScaleObject(obj, event.key, event.ctrlKey)
          )
          updateTable(...selectedObjects)
          break
        }
        selectedObjects.forEach((obj) =>
          handleMoveObject(obj, event.key, event.ctrlKey)
        )
        updateTable(...selectedObjects)
        break
      case "d":
        if (event.ctrlKey) {
          const newObject = {
            ...selectedObjects[0],
            id: selectedObjects[0].id + "d" + count,
          }
          count++
          objects.push(newObject)
          redrawObjects(selectedObjects, [newObject])
        }
        break
    }
  }

  /* DRAGGABLE SVG ELEMENTS */
  svg.addEventListener("mousedown", startDrag)
  svg.addEventListener("mousemove", drag)
  svg.addEventListener("mouseup", endDrag)
  svg.addEventListener("touchstart", startDrag)
  svg.addEventListener("touchmove", drag)
  svg.addEventListener("touchend", endDrag)
  svg.addEventListener("touchcancel", endDrag)

  function getMousePosition(event: MouseEvent | TouchEvent) {
    var CTM = (svg as unknown as SVGGraphicsElement).getScreenCTM()
    if (!CTM) {
      throw new Error("Could not determine Mouse Location")
    }
    var mouseEvent: MouseEvent
    if (event instanceof TouchEvent && event.touches) {
      mouseEvent = event.touches[0] as unknown as MouseEvent
    } else {
      mouseEvent = event as MouseEvent
    }
    return {
      x: (mouseEvent.clientX - CTM.e) / CTM.a,
      y: (mouseEvent.clientY - CTM.f) / CTM.d,
    }
  }

  var mouseStartPosition: { x: number; y: number },
    preDragCoordinates: { x: number; y: number }[],
    isDrag: boolean,
    isSelect: boolean,
    $selectionRectangle: SVGElement | undefined

  function startDrag(event: MouseEvent | TouchEvent) {
    if (event.ctrlKey) return
    if (
      !event.target ||
      (event.target as HTMLElement).tagName === "svg" ||
      !selectedObjects
    ) {
      if (event.target && (event.target as HTMLElement).tagName === "svg") {
        isSelect = true
        mouseStartPosition = getMousePosition(event)
        $selectionRectangle = initializeSelectionRectangle(
          mouseStartPosition.x,
          mouseStartPosition.y
        )
        console.log("Start selecting")
      }
      return
    }

    console.log("start drag")
    preDragCoordinates = selectedObjects.map(({ x, y }) => ({ x, y }))
    isDrag = true
    mouseStartPosition = getMousePosition(event)
  }

  function drag(event: MouseEvent | TouchEvent) {
    if (isSelect) {
      event.preventDefault()
      var currentMousePosition = getMousePosition(event)
      updateSelectionRectangle(
        $selectionRectangle!,
        mouseStartPosition,
        currentMousePosition
      )
    }
    if (selectedObjects && isDrag) {
      event.preventDefault()
      var currentMousePosition = getMousePosition(event)

      selectedObjects.forEach((object, index) => {
        var newX =
          preDragCoordinates[index].x +
          (currentMousePosition.x - mouseStartPosition.x)
        var newY =
          preDragCoordinates[index].y +
          (currentMousePosition.y - mouseStartPosition.y)

        if (event.ctrlKey) {
          newX = snapToGrid(newX)
          newY = snapToGrid(newY)
        }

        const xOffset = newX - object.x
        const yOffset = newY - object.y
        object.x = newX
        object.y = newY
        if (object.shape === "poly") {
          translatePolyObject(object, xOffset, yOffset)
        }
      })
      redrawObjects(selectedObjects)
    }
  }

  function endDrag(event: MouseEvent | TouchEvent) {
    if (isSelect) {
      // Add all objects inside rectangle to selectedObjects
      const currentMousePosition = getMousePosition(event)
      const upperLeftCorner = {
        x: Math.min(currentMousePosition.x, mouseStartPosition.x),
        y: Math.min(currentMousePosition.y, mouseStartPosition.y),
      }
      const lowerRightCorner = {
        x: Math.max(currentMousePosition.x, mouseStartPosition.x),
        y: Math.max(currentMousePosition.y, mouseStartPosition.y),
      }
      updateSelectedObject(
        getObjectsWithinBoundary(objects, upperLeftCorner, lowerRightCorner)
      )
      hideSelectionRectangle($selectionRectangle)
    }
    isDrag = false
    isSelect = false
  }
}

export function updateSelectedObject(objs: IObject[]) {
  const oldSelectedObject = [...selectedObjects]
  selectedObjects = [...objs]
  redrawObjects(selectedObjects, oldSelectedObject)
  updateTable(...selectedObjects)
}

export {
  $svgElements,
  scene,
  objects,
  selectedObjects,
  $tableElements,
  $output,
}
