import { controls, editor, table } from "components/editor"
import { footer } from "components/footer"
import header from "components/header"
import { knowledgeImports } from "components/knowledge"
import { main } from "components/main"
import { defaultSituation } from "data/situations"
import { clearEOPRA, getRelationsBetweenTwoObjects, drawEOPRA } from "knowledge"
import setupEditor from "output/shared/editor/setup"
import { setupLevelSelection } from "output/shared/levelSelect"
import { loadSituationFile } from "output/shared/situationFile/load"
import { generatorStore, relationGenerators } from "stores/generatorStore"
import { selectedObjectStore } from "stores/objects"
import { svgStore } from "stores/svgElements"

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

  $input.value = defaultSituation

  $input.addEventListener("blur", () => {
    loadSituationFile($input.value)
  })
  loadSituationFile($input.value)

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

  // Load from Level
  setupLevelSelection($levelSelect, () => {
    loadSituationFile($input.value)
  })

  // Generator Selection
  setupGeneratorSelection()

  setupEditor($container)
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
