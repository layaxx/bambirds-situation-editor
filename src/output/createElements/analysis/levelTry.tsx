/* eslint-disable unicorn/prefer-dom-node-dataset */
import { levelMap } from "components/levels/map"
import { situationFiles } from "data/situations"
import { ABObject } from "objects/angryBirdsObject"
import { drawTargetCrossAt } from "output/svg"
import { formatPlan, formatResult } from "parser/logFile/plans"
import type { Effect, LevelTry } from "parser/logFile/state"
import { idsFromArrayString, successfulUse } from "parser/logFile/utils"
import parse from "parser/situationFileParser"
import jsx from "texsaur"

export const levelTry = async ({ levelTry }: { levelTry: LevelTry }) => {
  let shotIndex = 0

  const situation = await fetch(
    "/build/" + String(situationFiles.at(Number(levelTry.id) - 1))
  ).then(async (result) => result.text())

  if (!situation) {
    console.error("Situation file not found")
    return <></>
  }

  const objects = parse(situation).objects
  const map = levelMap({
    objects,
    noGrid: true,
    omitBirds: true,
    scaleFactor: 10,
  })

  const toggleOverlay = (event: MouseEvent) => {
    const effects = levelTry.shots.at(0)?.cbrEffects

    let newState = ""

    if (effects === undefined)
      console.error("CBR Effects missing for Try", levelTry)

    removeOverlay(map)

    switch (map.getAttribute("data-overlay")) {
      case "expected":
        newState = "actual"
        break
      case "actual":
        newState = "disabled"
        break
      default:
        newState = "expected"
        break
    }

    map.setAttribute("data-overlay", newState)

    let effect
    if (newState === "expected") effect = effects?.expected
    if (newState === "actual") effect = effects?.actual

    if (effect)
      drawEffects(map, effect, levelTry.shots.at(0)?.executed?.target, objects)

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (event.target?.textContent)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      event.target.textContent = `toggle Overlay ${
        newState ? `(${newState})` : ""
      }`
  }

  return (
    <article>
      <div class="grid">
        <div>
          <h3>Level {levelTry.id}</h3>
          {levelTry.shots
            .at(0)
            ?.executed?.strategy.toLowerCase()
            .includes("cbr") ? (
            <button onclick={toggleOverlay}>toggle Overlay</button>
          ) : undefined}
        </div>
        <div>{map}</div>
      </div>
      {levelTry.chronology.map(({ data, type }) => {
        if (type === "string") {
          return (
            <details class="greyed-out">
              <summary>Status: {data}</summary>
            </details>
          )
        }

        if (type === "shot") {
          return (
            <details>
              <summary>
                Shot {++shotIndex}: {formatPlan(data.executed)},{" "}
                {formatResult(data.result)}
                {data.cbrEffects
                  ? `, success: "${successfulUse({ effect: data.cbrEffects })}"`
                  : ""}
              </summary>
              <p>{data.candidates.map((plan) => formatPlan(plan) + "\n")}</p>
            </details>
          )
        }

        return undefined
      })}
      <h4 class={getColorClass(levelTry.result)}>
        Status: {levelTry.result ?? "Unknown"}
      </h4>
    </article>
  )
}

function getColorClass(string: string | undefined) {
  switch (string) {
    case "WON":
      return "green"
    case "LOST":
      return "red"
    default:
      return ""
  }
}

function removeOverlay(map: Element) {
  map.querySelector("#overlay")?.replaceChildren()
}

function drawEffects(
  map: Element,
  effect: Effect,
  target: string | undefined,
  objects: ABObject[]
) {
  let $overlay = map.querySelector("#overlay")

  if ($overlay === null) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    $overlay = jsx("g", { id: "overlay" })
    const svg = map.querySelector("svg")
    svg?.append($overlay)
  }

  const idsDestroyed = idsFromArrayString(effect.destroyed)
  const idsMoved = idsFromArrayString(effect.moved)

  let targetFound = false

  for (const object of objects) {
    if (idsDestroyed?.includes(object.id)) {
      const clone = object.clone(object.id + "destroyed")
      clone.material = "cbr_destroyed"
      clone.render($overlay as SVGElement)
    } else if (idsMoved?.includes(object.id)) {
      const clone = object.clone(object.id + "moved")
      clone.material = "cbr_moved"
      clone.render($overlay as SVGElement)
    }

    if (object.id === target) {
      targetFound = true
      drawTargetCrossAt(object.getCenter(), $overlay as SVGElement)
    }
  }

  if (!targetFound || !target)
    console.error(
      "Failed to determine target " + String(target),
      objects.map((object) => object.id)
    )

  $overlay.append()
}
