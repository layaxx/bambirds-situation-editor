import { IObject, SelectionMeta, SVGElements, TableElements } from "./types"
import {
  getCenterFromObjects,
  getObjectsWithinBoundary,
  handleMoveObject,
  handleScaleObject,
  translatePolyObject,
} from "./objects/helper"
import { redrawAll, redrawObjects, removeObjects, updateCenter } from "./output"
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
var $svgElements: SVGElements
var $keepPredicates: HTMLInputElement
var $tableElements: TableElements
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
    id: document.getElementById("selected-object-id") as TableElements["id"],
    x: document.getElementById("selected-object-x") as TableElements["x"],
    y: document.getElementById("selected-object-y") as TableElements["y"],
    s: document.getElementById("selected-object-s") as TableElements["s"],
    a: document.getElementById("selected-object-a") as TableElements["a"],
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

var selectionMeta: SelectionMeta = {
  angle: 0,
  scale: 1,
  center: { x: 0, y: 0 },
  origins: [],
  vectors: [],
}
var uuidCounter = 1

function setUpEventHandlers(svg: HTMLElement) {
  /* CONTROLS */
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

        removeObjects(hasBeenDeleted)
        selectedObjects = []
        updateTable(...selectedObjects)
        updateCenter([])
        break
      case "ArrowLeft":
      case "ArrowRight":
        if (event.altKey) {
          // Rotate
          const offset = 0.01 * (event.ctrlKey ? 10 : 1)
          const angle = event.key === "ArrowRight" ? +offset : -offset
          const center = getCenterFromObjects(selectedObjects)
          // rotate center of objects
          selectedObjects.forEach((object, index) => {
            const vector = { x: object.x - center.x, y: object.y - center.y }

            object.x =
              center.x + Math.cos(angle) * vector.x - Math.sin(angle) * vector.y
            object.y =
              center.y + Math.sin(angle) * vector.x + Math.cos(angle) * vector.y

            if (object.shape === "poly") {
              console.error("Cannot rotate poly objects")
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
            handleScaleObject(obj, event.key, event.ctrlKey)
            const center = selectionMeta.center
            if (selectedObjects.length > 1) {
              obj.x =
                center.x + selectionMeta.scale * selectionMeta.vectors[index].x
              obj.y =
                center.y + selectionMeta.scale * selectionMeta.vectors[index].y
            }
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
            id: selectedObjects[0].id + "d" + uuidCounter,
          }
          uuidCounter++
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
      updateCenter(selectedObjects)
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
      const newSelectedObjects = getObjectsWithinBoundary(
        objects,
        upperLeftCorner,
        lowerRightCorner
      )
      updateSelectedObjects(newSelectedObjects)
      hideSelectionRectangle($selectionRectangle)
    }
    isDrag = false
    isSelect = false
  }
}

export function updateSelectedObjects(objects: IObject[]) {
  const oldSelectedObject = [...selectedObjects]
  selectedObjects = [...objects]
  redrawObjects(selectedObjects, oldSelectedObject)

  updateCenter(selectedObjects)

  updateTable(...selectedObjects)

  const center = getCenterFromObjects(objects)

  selectionMeta = {
    center,
    vectors: objects.map(({ x, y }) => ({
      x: x - center.x,
      y: y - center.y,
    })),
    origins: objects.map(({ x, y }) => ({ x, y })),
    scale:
      objects.length === 0
        ? 1
        : objects.reduce(
            (accumulator, current) => accumulator + current.scale,
            0
          ) / objects.length,
    angle: 0.0,
  }
}

export {
  $svgElements,
  scene,
  objects,
  selectedObjects,
  $tableElements,
  $output,
}
