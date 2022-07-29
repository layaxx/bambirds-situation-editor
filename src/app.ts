import { IObject, SelectionMeta, SVGElements, TableElements } from "./types"
import { getCenterFromObjects } from "./objects/helper"
import { redrawAll, redrawObjects, updateCenter } from "./output"
import { exportFile } from "./output/prolog"
import { drawGrid, setUpGroups } from "./output/svg"
import parse from "./parser/situationFileParser"
import { updateTable } from "./output/table"
import { setUpEventHandlers } from "./canvasEventHandler"

var $input: HTMLInputElement
var $output: HTMLInputElement
var $svgElements: SVGElements
var $keepPredicates: HTMLInputElement
var $tableElements: TableElements
var objects: IObject[]
var selectedObjects: IObject[] = []
var scene: any
var selectionMeta: SelectionMeta = {
  angle: 0,
  scale: 1,
  center: { x: 0, y: 0 },
  origins: [],
  vectors: [],
}
var uuidCounter = 1

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

export function getUID() {
  return uuidCounter++
}

export {
  $svgElements,
  scene,
  objects,
  selectedObjects,
  selectionMeta,
  $tableElements,
  $output,
}
