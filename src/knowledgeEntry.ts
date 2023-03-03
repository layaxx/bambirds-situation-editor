import { redrawAll, redrawObjects, updateCenter } from "./output"
import { setUpGroups } from "./output/svg"
import parse from "./parser/situationFileParser"
import { updateTable } from "./output/table"
import { setUpEventHandlers } from "./canvasEventHandler"
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
import { generatorStore, relationGenerators } from "./stores/generatorStore"
import {
  clearEOPRA,
  drawEOPRA,
  getRelationsBetweenTwoObjects,
} from "./knowledge"
import header from "./output/createElements/header"
import { footer } from "./output/createElements/footer"
import { main } from "./output/createElements/main"
import { knowledgeImports } from "./output/createElements/knowledge"
import { controls, editor, table } from "./output/createElements/editor"

console.log("Loaded knowledgeEntry.ts")

let $input: HTMLInputElement
let $levelSelect: HTMLSelectElement
let $generatorSelect: HTMLSelectElement

function init() {
  new EventSource("/esbuild").addEventListener("change", () => {
    location.reload()
  })

  document
    .querySelector("body")
    ?.append(
      header({ active: "/knowledge.html" }),
      main({ children: [knowledgeImports(), editor(), table(), controls()] }),
      footer()
    )

  $input = document.querySelector("#situationfile")!
  $levelSelect = document.querySelector("#loadFromLevel")!
  $generatorSelect = document.querySelector("#generator-select")!
  const $container = document.querySelector<HTMLElement>("#container")!
  if (
    $input === null ||
    $container === null ||
    $levelSelect === null ||
    $generatorSelect === null
  ) {
    console.error(
      "Failed to get required HTML Elements, missing at least one of $situationfile, $container, $levelSelect, $generatorSelect"
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

  document.querySelector("#clear-overlay")?.addEventListener("click", () => {
    ;[...(svgStore.get()?.$groupOverlay.children ?? [])].forEach((element) => {
      element.remove()
    })
  })

  document
    .querySelector("#generate-predicates")
    ?.addEventListener("click", () => {
      const selectedObjects = selectedObjectStore.get()
      if (generatorStore.get().name === "EOPRA")
        clearEOPRA(svgStore.get()!.$groupOverlay)
      selectedObjects.forEach((element) => {
        selectedObjects.forEach((element2) => {
          if (element !== element2)
            getRelationsBetweenTwoObjects(element, element2)
        })
        if (generatorStore.get().name === "EOPRA")
          drawEOPRA(element, svgStore.get()!.$groupOverlay)
      })
    })

  $input.addEventListener("blur", () => {
    loadSituationFile()
  })
  loadSituationFile()

  // Load from Level
  setupLevelSelection()

  // Generator Selection
  setupGeneratorSelection()

  objectStore.subscribe((objects: ABObject[]) => {
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

// Load Situation File
function loadSituationFile() {
  const loadResult = parse($input.value)
  objectStore.set(loadResult.objects)
  sceneStore.set(loadResult.scene)
}

function setupLevelSelection() {
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

  $levelSelect.addEventListener("change", (event) => {
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
}

function setupGeneratorSelection() {
  for (const [index, generator] of relationGenerators.entries()) {
    const option = document.createElement("option")
    option.text = generator.name
    option.value = String(index)

    $generatorSelect.append(option)
  }

  $generatorSelect.addEventListener("change", (event) => {
    if (event?.target) {
      const value = Number((event.target as HTMLSelectElement).value)

      generatorStore.set(relationGenerators[value])
    }
  })
}

init()
