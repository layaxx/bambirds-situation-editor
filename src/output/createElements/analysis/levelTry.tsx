import { formatPlan, formatResult } from "parser/logFile/plans"
import type { LevelTry } from "parser/logFile/state"
import jsx from "texsaur"

export const levelTry: JSX.Component<{ levelTry: LevelTry }> = ({
  levelTry,
}) => {
  let shotIndex = 0

  return (
    <article>
      <h3>Level {levelTry.id}</h3>
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
