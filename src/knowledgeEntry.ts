import { Case } from "./types"
import { redrawAll, redrawObjects, removeObjects, updateCenter } from "./output"
import { exportFile } from "./output/prolog"
import { setUpGroups } from "./output/svg"
import parse from "./parser/situationFileParser"
import { updateTable } from "./output/table"
import { setUpEventHandlers } from "./canvasEventHandler"
import parseDatabase from "./parser/databaseParser"
import {
  analyzeCase,
  hideAllCaseOverlays,
  showAllCaseOverlays,
} from "./output/caseBasedReasoning"
import { ABObject } from "./objects/angryBirdsObject"
import levels from "./levels/index"
import parseLevel from "./parser/levelParser"
import {
  makeBackup,
  objectStore,
  previousSelectedObjectStore,
  selectedObjectStore,
} from "./stores/objects"
import { selectionMetaStore } from "./stores/selection"
import { sceneStore } from "./stores/scene"
import { svgStore } from "./stores/svgElements"
import { tableStore } from "./stores/table"
import { defaultSituation } from "./data/situation"

console.log("Loaded knowledgeEntry.ts")

let $input: HTMLInputElement
let $levelSelect: HTMLSelectElement
let $output: HTMLInputElement
let $keepPredicates: HTMLInputElement
let $databaseInput: HTMLInputElement
let $CBRResults: HTMLElement

/**
 * Sets up everything needed for the Situation Editor,
 * loads and displays all objects,
 * loads and evaluates all cases
 */
function init() {
  new EventSource("/esbuild").addEventListener("change", () => {
    location.reload()
  })

  $input = document.querySelector("#situationfile")!
  $levelSelect = document.querySelector("#loadFromLevel")!
  const $container = document.querySelector<HTMLElement>("#container")!
  if ($input === null || $container === null || $levelSelect === null) {
    console.error(
      "Failed to get required HTML Elements, missing at least one of $situationfile, $container, $levelSelect"
    )
    return
  }

  $input.value = defaultSituation

  tableStore.set({
    id: document.querySelector("#selected-object-id")!,
    x: document.querySelector("#selected-object-x")!,
    y: document.querySelector("#selected-object-y")!,
    s: document.querySelector("#selected-object-s")!,
    a: document.querySelector("#selected-object-a")!,
  })
  const $tableElements = tableStore.get()
  if (
    $tableElements!.id === null ||
    $tableElements!.x === null ||
    $tableElements!.y === null ||
    $tableElements!.s === null ||
    $tableElements!.a === null
  ) {
    console.error(
      "Failed to get output HTML Elements, missing at least one from selected Object Inputs"
    )
  }

  svgStore.set(setUpGroups($container))

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
    objectStore.set(loadResult.objects)
    sceneStore.set(loadResult.scene)
  }

  $input.addEventListener("blur", () => {
    loadSituationFile()
  })
  loadSituationFile()

  // Load from Level
  const option = document.createElement("option")
  option.text = `Load from Level`
  option.value = "-1"
  $levelSelect.append(option)

  for (let index = 1; index <= levels.length; index++) {
    const option = document.createElement("option")
    option.text = `Level1-${index}`
    option.value = String(index - 1)

    $levelSelect.append(option)
  }

  $levelSelect.addEventListener("click", (event) => {
    if (event?.target) {
      const value = Number((event.target as HTMLSelectElement).value)

      if (value > -1 && levels.at(value)) {
        const result = parseLevel(levels.at(value)!)
        objectStore.set(result.objects)
        sceneStore.set(result.scene)
      }

      if (value === -1) loadSituationFile()
    }
  })

  objectStore.subscribe((objects: ABObject[]) => {
    console.log("Change", objects.length, objectStore.get().length)

    redrawAll(objects)
  })
  selectedObjectStore.subscribe((objects: ABObject[]) => {
    if (objects.length > 0) makeBackup()
    redrawObjects(selectedObjectStore.get(), previousSelectedObjectStore.get())
    updateCenter(selectedObjectStore.get())
    updateTable(...selectedObjectStore.get())

    selectionMetaStore.set({
      scale:
        objects.length === 0
          ? 1
          : objects.reduce(
              (accumulator, current) => accumulator + current.scale,
              0
            ) / objects.length,
    })

    previousSelectedObjectStore.set(objects)
  })
}

init()
