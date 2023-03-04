import { analysisImports } from "components/analysis/imports"
import { outputElement } from "components/analysis/outputElement"
import { timeline } from "components/analysis/timeline"
import { button, generic } from "components/generic"
import { footer } from "components/footer"
import { grid } from "components/grid"
import header from "components/header"
import { main } from "components/main"
import logs from "data/logs"
import LevelState from "parser/logFile/state"
import { successfulUse } from "parser/logFile/utils"
import { Store } from "stores/store"
import jsx from "texsaur"

console.log("Loaded analysis.ts")

const logStore = new Store<{ id: string; content: string }>(logs[0])

function init() {
  new EventSource("/esbuild").addEventListener("change", () => {
    location.reload()
  })

  const $outputElement = outputElement()
  const $timeline = jsx("div", {})
  const $summary = jsx("div", {})

  const mainElement = main({
    children: [
      analysisImports({
        options: logs.filter((log) => typeof log.id === "string") as Array<{
          id: string
        }>,
        changeHandler(ev) {
          logStore.set(
            logs
              .filter((log) => typeof log.id === "string")
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-expect-error
              .at(Number(ev.target?.value)) ?? { id: "invalid", content: "" }
          )
        },
      }),
      $outputElement,
      $summary,
      $timeline,
    ],
  })
  document
    .querySelector("body")
    ?.append(
      header({ active: "/analysis.html", subtitle: "Run Analysis" }),
      mainElement,
      footer()
    )

  logStore.subscribe(async ({ content, id }) => {
    content = await fetch("build/" + content).then(async (response) =>
      response.text()
    )
    $outputElement.textContent = content

    const state = new LevelState()
    state.addMultipleLines(content.split("\n"))

    $timeline.replaceChildren(timeline({ state }))

    $summary.replaceChildren(
      grid({
        children: [
          generic(
            "div",
            generic("h2", "Maximum Score"),
            generic(
              "ul",
              ...getScoreData(state, "").map(({ score }, index) =>
                generic("li", `Level ${index + 1}: ${score ?? 0}`)
              )
            )
          ),
          generic(
            "div",
            generic("h2", "Export Data to console"),
            generic(
              "div",
              generic("h3", "for current run"),
              button("Maximum Score", () => {
                console.log("Maximum Score", getScoreData(state, id))
              }),
              button("CBR first shot", () => {
                console.log(
                  "CBR on first shot",
                  getCBRShotsOnFirstShotPerLevelData(state, id)
                )
              }),
              button("CBR Success rate", () => {
                console.log("Success rate", getCBRSuccessRateData(state, id))
              }),
              button("Strategies", () => {
                console.log("Strategies", getStrategyData(state, id))
              })
            ),
            generic(
              "div",
              generic("h3", "for all runs"),
              button("Maximum Score", async () => {
                console.log("Maximum Score", await applyToAll(getScoreData))
              }),
              button("CBR first shot", async () => {
                console.log(
                  "CBR on first shot",
                  await applyToAll(getCBRShotsOnFirstShotPerLevelData)
                )
              }),
              button("CBR Success rate", async () => {
                console.log(
                  "Success rate",
                  await applyToAll(getCBRSuccessRateData)
                )
              }),
              button("Strategies", async () => {
                console.log("Strategies", await applyToAll(getStrategyData))
              })
            )
          ),
        ],
      })
    )
  })
}

init()

function getScoreData(state: LevelState, id: string) {
  return Array.from({ length: 21 })
    .map((_, idx) => {
      if (state.levels.has(String(idx + 1))) {
        return state.levels.get(String(idx + 1))?.maxScore
      }

      return 0
    })
    .map((score) => ({ id, score }))
}

function getCBRSuccessRateData(state: LevelState, id: string) {
  return [...state.newCBRCases.values()].flatMap((c) =>
    c.uses.map((use) => ({
      id,
      caseID: c.id,
      successful: successfulUse(use),
    }))
  )
}

function getCBRShotsOnFirstShotPerLevelData(state: LevelState, id: string) {
  return [...state.newCBRCases.values()].flatMap((c) =>
    c.uses
      .filter((use) => use.shotNumber === 1)
      .map((use) => ({ id, caseID: c.id, level: use.level }))
  )
}

function getStrategyData(state: LevelState, id: string) {
  const strategies = []

  for (const level of state.levels.values()) {
    for (const shot of level.shots) {
      strategies.push(
        {
          id,
          level: level.id,
          strategy: shot.executed?.strategy,
          type: "executed",
        },
        ...shot.candidates
          .filter((candidate) => candidate.strategy !== "demo")
          .map((candidate) => ({
            id,
            level: level.id,
            strategy: candidate.strategy,
            type: "candidate",
          }))
      )
    }
  }

  return strategies
}

async function applyToAll<T>(
  func: (state: LevelState, id: string) => T[]
): Promise<T[]> {
  const arrays = await Promise.all(
    logs.map(async ({ content, id }) => {
      content = await fetch("build/" + String(content)).then(async (response) =>
        response.text()
      )
      const state = new LevelState()
      state.addMultipleLines(String(content).split("\n"))
      return func(state, id)
    })
  )

  return arrays.flat()
}
