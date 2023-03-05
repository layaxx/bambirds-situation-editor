import { editor, controls, table } from "components/editor"
import { footer } from "components/footer"
import { grid } from "components/grid"
import header from "components/header"
import { cbrAnalysis } from "components/index/cbrAnalysis"
import { cbrDB } from "components/index/cbrDB"
import { indexImports } from "components/index/imports"
import { main } from "components/main"
import { defaultSituation } from "data/situations"
import {
  analyzeCase,
  showAllCaseOverlays,
  hideAllCaseOverlays,
} from "output/caseBasedReasoning"
import { exportFile } from "output/prolog"
import setupEditor from "output/shared/editor/setup"
import { setupLevelSelection } from "output/shared/levelSelect"
import { loadSituationFile } from "output/shared/situationFile/load"
import parseDatabase from "parser/databaseParser"
import { objectStore } from "stores/objects"
import { svgStore } from "stores/svgElements"
import { Case } from "types"

console.log("Loaded app.ts")

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

  document.querySelector("body")?.append(
    header({ active: "/" }),
    main({
      children: [
        indexImports(),
        editor(),
        grid({ children: [table(), cbrAnalysis()] }),
        controls(),
        cbrDB(),
      ],
    }),

    footer()
  )

  $input = document.querySelector("#situationfile")!
  $levelSelect = document.querySelector("#loadFromLevel")!
  const $container = document.querySelector<HTMLElement>("#container")!

  $input.value = defaultSituation

  $keepPredicates = document.querySelector("#keepDerivedPredicates")!
  document.querySelector("#exportButton")?.addEventListener("click", () => {
    exportFile($output, $keepPredicates.checked)
  })

  // Load Situation File
  $input.addEventListener("blur", () => {
    loadSituationFile($input.value)
  })
  loadSituationFile($input.value)

  // Load from Level
  setupLevelSelection($levelSelect, () => {
    loadSituationFile($input.value)
  })

  // Load Database
  setupCBR()

  // Setup Editor
  setupEditor($container)
}

init()

function setupCBR() {
  $databaseInput = document.querySelector("#database")!
  $CBRResults = document.querySelector("#analysis-results")!
  if ($databaseInput === null) {
    console.warn("Failed to get HTML Elements for Database")
  }

  const evaluateDatabase = (cases: Case[]) => {
    $CBRResults.replaceChildren()
    svgStore.get()?.$groupOverlay.replaceChildren()

    const results = cases.map((caseParameter) =>
      analyzeCase(caseParameter, objectStore.get())
    )
    $CBRResults.append(...results.map((result) => result.element))

    const button = document.querySelector<HTMLButtonElement>("#cases-show-all")

    if (button)
      // eslint-disable-next-line unicorn/prefer-add-event-listener
      button.onclick = () => {
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
