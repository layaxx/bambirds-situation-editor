import {
  Case,
  IObject,
  Point,
  Scene,
  SelectionMeta,
  SVGElements,
  TableElements,
} from "./types"
import {
  getCenter,
  getCenterFromObjects,
  getVectorBetween,
} from "./objects/helper"
import { redrawAll, redrawObjects, updateCenter } from "./output"
import { exportFile } from "./output/prolog"
import { drawGrid, setUpGroups } from "./output/svg"
import parse from "./parser/situationFileParser"
import { updateTable } from "./output/table"
import { setUpEventHandlers } from "./canvasEventHandler"
import parseDatabase from "./parser/databaseParser"
import {
  analyzeCase,
  hideAllCaseOverlays,
  showAllCaseOverlays,
} from "./output/caseBasedReasoning"

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

/**
 * Sets up everything needed for the Situation Editor,
 * loads and displays all objects,
 * loads and evaluates all cases
 */
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

  const evaluateDatabase = (cases: Case[]) => {
    $CBRResults.replaceChildren()
    $svgElements.$groupOverlay.replaceChildren()

    const results = cases.map((caseParameter) =>
      analyzeCase(caseParameter, objects)
    )
    $CBRResults.append(...results.map((result) => result.element))

    const button = document.querySelector<HTMLButtonElement>("#cases-show-all")

    if (button)
      // eslint-disable-next-line unicorn/prefer-add-event-listener
      button.onclick = () => {
        console.log(
          cases.map((caseParameter, index) => ({
            caseParameter,
            transformations: results[index].result,
          }))
        )
        showAllCaseOverlays(
          cases.map((caseParameter, index) => ({
            caseParameter,
            transformations: results[index].result,
          }))
        )
      }
  }

  const loadDatabase = () => {
    const cases = parseDatabase($databaseInput.value)
    evaluateDatabase(cases)
    const button = document.querySelector<HTMLButtonElement>("#cases-analyze")
    if (button)
      // eslint-disable-next-line unicorn/prefer-add-event-listener
      button.onclick = () => {
        evaluateDatabase(cases)
      }
  }

  document
    .querySelector("#cases-hide-all")
    ?.addEventListener("click", hideAllCaseOverlays)

  $databaseInput.addEventListener("blur", () => {
    loadDatabase()
  })
  loadDatabase()
}

init()

/**
 * Updates {@link selectedObjects} and {@link selectionMeta} to reflect the new given objects,
 * redraws the given objects and their center and updates the table
 *
 * @param objects - new selected objects
 */
export function updateSelectedObjects(objects: IObject[]): void {
  const oldSelectedObject = [...selectedObjects]
  selectedObjects = [...objects]
  redrawObjects(selectedObjects, oldSelectedObject)
  updateCenter(selectedObjects)
  updateTable(...selectedObjects)

  const center = getCenterFromObjects(objects)

  const origins: Point[] = objects.map((object) => getCenter(object))
  selectionMeta = {
    center,
    vectors: origins.map((point) => getVectorBetween(point, center)),
    origins,
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

/**
 * Returns the current value of a counter and increases counter,
 * i.e. returns strictly increasing values on each call
 */
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
