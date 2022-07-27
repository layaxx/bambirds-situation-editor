import { IObject } from "./objects/data"
import {
  handleMoveObject,
  handleRotateObject,
  handleScaleObject,
  translatePolyObject,
} from "./objects/helper"
import { redrawAll, redrawObjects } from "./output"
import { exportFile } from "./output/prolog"
import { drawGrid, drawHorizontalLine, snapToGrid } from "./output/svg"
import { updateTable } from "./output/table"
import parse from "./parser/situationFileParser"

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
var selectedObject: IObject | undefined
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

  // Setup SVG Groups
  const $groupBackground = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  )
  $groupBackground.setAttribute("id", "group-background")
  const $groupObjects = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  )
  $groupObjects.setAttribute("id", "group-objects")
  const $groupOverlay = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  )
  $groupOverlay.setAttribute("id", "group-overlay")
  $container.append($groupBackground, $groupObjects, $groupOverlay)

  $svgElements = {
    $svg: $container,
    $groupBackground,
    $groupObjects,
    $groupOverlay,
  }

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

    redrawAll()
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
    if (!selectedObject) {
      return
    }
    switch (event.key) {
      case "Delete":
        const index = objects.findIndex(({ id }) => id === selectedObject?.id)
        objects.splice(index, 1)
        redrawObjects({ id: selectedObject.id } as IObject)
        selectedObject = undefined
        updateTable()
        break
      case "ArrowLeft":
      case "ArrowRight":
        if (event.altKey) {
          // Rotate
          handleRotateObject(event.key, event.ctrlKey)
          break
        }
      case "ArrowUp":
      case "ArrowDown":
        if (event.altKey) {
          // Scale
          handleScaleObject(event.key, event.ctrlKey)
          break
        }
        handleMoveObject(event.key, event.ctrlKey)
        break
      case "d":
        if (event.ctrlKey) {
          const newObject = {
            ...selectedObject,
            id: selectedObject.id + "d" + count,
          }
          count++
          objects.push(newObject)
          redrawObjects(newObject, selectedObject)
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
    preDragCoordinates: { x: number; y: number },
    isDrag: boolean

  function startDrag(event: MouseEvent | TouchEvent) {
    if (
      !event.target ||
      (event.target as HTMLElement).tagName === "svg" ||
      !selectedObject
    )
      return

    console.log("start drag")
    const { x, y } = selectedObject
    preDragCoordinates = { x, y }
    isDrag = true
    mouseStartPosition = getMousePosition(event)
  }

  function drag(event: MouseEvent | TouchEvent) {
    if (selectedObject && isDrag) {
      event.preventDefault()
      var currentMousePosition = getMousePosition(event)

      var newX =
        preDragCoordinates.x + (currentMousePosition.x - mouseStartPosition.x)
      var newY =
        preDragCoordinates.y + (currentMousePosition.y - mouseStartPosition.y)

      if (event.ctrlKey) {
        newX = snapToGrid(newX)
        newY = snapToGrid(newY)
      }

      const xOffset = newX - selectedObject.x
      const yOffset = newY - selectedObject.y
      selectedObject.x = newX
      selectedObject.y = newY
      if (selectedObject.shape === "poly") {
        translatePolyObject(selectedObject, xOffset, yOffset)
      }
      redrawObjects(selectedObject)
    }
  }

  function endDrag() {
    isDrag = false
  }
}

export function updateSelectedObject(obj?: IObject) {
  selectedObject = obj
}

export { $svgElements, scene, objects, selectedObject, $tableElements, $output }
