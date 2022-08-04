import {
  IObject,
  Scene,
  SelectionMeta,
  SVGElements,
  TableElements,
} from "./types"
import { getCenterFromObjects } from "./objects/helper"
import { redrawAll, redrawObjects, updateCenter } from "./output"
import { exportFile } from "./output/prolog"
import { drawGrid, setUpGroups } from "./output/svg"
import parse from "./parser/situationFileParser"
import { updateTable } from "./output/table"
import { setUpEventHandlers } from "./canvasEventHandler"
import parseDatabase from "./parser/databaseParser"
import { analyzeCase } from "./output/caseBasedReasoning"

let $input: HTMLInputElement
let $output: HTMLInputElement
let $svgElements: SVGElements
let $keepPredicates: HTMLInputElement
let $tableElements: TableElements
let $databaseInput: HTMLInputElement
let $CBRResults: HTMLElement
let objects: IObject[]
let selectedObjects: IObject[] = []
let scene: Scene
let selectionMeta: SelectionMeta = {
  angle: 0,
  scale: 1,
  center: { x: 0, y: 0 },
  origins: [],
  vectors: [],
}
let uuidCounter = 1

function init() {
  $input = document.querySelector("#situationfile")!
  const $container = document.querySelector<HTMLElement>("#container")!
  $output = document.querySelector("#output")!
  if ($input === null || $container === null || $output === null) {
    console.error(
      "Failed to get required HTML Elements, missing at least one of $situationfile, $container, $output"
    )
    return
  }

  $keepPredicates = document.querySelector("#keepDerivedPredicates")!
  document.querySelector("#exportButton")?.addEventListener("click", () => {
    exportFile($keepPredicates.checked)
  })

  $tableElements = {
    id: document.querySelector("#selected-object-id")!,
    x: document.querySelector("#selected-object-x")!,
    y: document.querySelector("#selected-object-y")!,
    s: document.querySelector("#selected-object-s")!,
    a: document.querySelector("#selected-object-a")!,
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

  // Setup SVG background
  drawGrid()

  // Setup SVG Scaling
  const slider = document.querySelector("#zoomRange")
  const zoomValue = document.querySelector("#zoomValue")
  if (slider === null) {
    console.error("Failed to setup SVG Scaling")
  } else {
    slider.addEventListener("input", function (event) {
      const value = Number.parseFloat(
        (event.target as HTMLInputElement | undefined)?.value ?? "100"
      )
      if (zoomValue !== null) {
        zoomValue.textContent = `${value}%`
      }

      $container.style.transform = `scale(${value / 100})`
    })
  }

  setUpEventHandlers($container)

  // Load Situation File
  const loadSituationFile = () => {
    const loadResult = parse($input.value)
    objects = loadResult.objects
    scene = loadResult.scene

    redrawAll(objects)
  }

  $input.addEventListener("blur", () => {
    loadSituationFile()
  })
  loadSituationFile()

  // Load Database
  $databaseInput = document.querySelector("#database")!
  $CBRResults = document.querySelector("#analysis-results")!
  if ($databaseInput === null) {
    console.warn("Failed to get HTML Elements for Database")
  }

  const loadDatabase = () => {
    const cases = parseDatabase($databaseInput.value)
    $CBRResults.replaceChildren()
    $svgElements.$groupOverlay.replaceChildren()

    const reloadButton = document.createElement("button")
    reloadButton.addEventListener("click", loadDatabase)
    reloadButton.textContent = "Reload"
    $CBRResults.append(reloadButton)

    $CBRResults.append(
      ...cases.map((caseParameter) => analyzeCase(caseParameter, objects))
    )
    console.log("cases", cases)
  }

  $databaseInput.addEventListener("blur", () => {
    loadDatabase()
  })
  loadDatabase()
}

init()

export function updateSelectedObjects(objects: IObject[]): void {
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
    angle: 0,
  }
}

export function getUID(): number {
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
