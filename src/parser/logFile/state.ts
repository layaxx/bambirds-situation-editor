import dayjs from "dayjs"
import minMax from "dayjs/plugin/minMax"
import { parsePlan, Plan } from "./plans"

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
dayjs.extend(minMax)

export type Shot = {
  candidates: Plan[]
  executed?: Plan
  result?: { killed: number; score: number }
}

type Level = {
  id: string
  tries: number
  shots: Shot[]
  maxScore: number
}

type ChronologyEntry =
  | {
      type: "string"
      data: string
    }
  | { type: "shot"; data: Shot }

export type LevelTry = {
  uID: string
  id: string
  shots: Shot[]
  result?: string
  chronology: ChronologyEntry[]
}

export type Use = {
  level: string
  shotNumber: number
  effect?: {
    expected: { moved: string; destroyed: string }
    actual: { moved: string; destroyed: string }
  }
  killed: number
}

type Case = {
  id: string
  uses: Use[]
}

export default class LevelState {
  levels = new Map<string, Level>()
  levelTries: LevelTry[] = []
  newCBRCases = new Map<string, Case>()
  lastCaseID = ""

  reset() {
    this.levels = new Map()
    this.levelTries = []
    this.newCBRCases = new Map()
  }

  getCurrentLevel() {
    return this.getCurrentTry()?.id
      ? this.levels.get(String(this.getCurrentTry()?.id))
      : undefined
  }

  getCurrentTry() {
    return this.levelTries.at(-1)
  }

  getCurrentShot() {
    return this.getCurrentTry()?.shots?.at(-1)
  }

  // eslint-disable-next-line complexity
  addLine(line: string) {
    const matched =
      /(?<status>\[\w*\s*]) (?<timestamp>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}) (?<origin>\[[^\]]*]) (?<msg>.*)/.exec(
        line
      )

    if (matched === null) {
      // L console.warn("Failed to parse line: " + line)
      return
    }

    const { status, timestamp, origin, msg } = matched.groups ?? {}
    if (msg.includes("Meta - Loading Level ")) {
      const { id } = /Meta - Loading Level (?<id>\d+)/.exec(msg)?.groups ?? {}

      if (!id) console.warn("Failed to parse load level: " + line)
      this.levelTries.push({
        id,
        shots: [],
        chronology: [],
        uID: id + String(Date.now()),
      })
      if (this.levels.has(id)) this.levels.get(id)!.tries++
      else this.levels.set(id, { id, tries: 1, shots: [], maxScore: 0 })
    } else {
      if (this.levelTries.length === 0) {
        return
      }

      if (msg.includes("ShotSelection - Plan:")) {
        if (this.levelTries.length > 0)
          this.getCurrentShot()!.candidates.push(parsePlan(msg))
      } else if (msg.includes("ShotSelection - Chosen target:")) {
        this.getCurrentShot()!.executed = parsePlan(msg, true)
      } else {
        const resultResult =
          /Meta - .* score: (?<score>\d+) killed: (?<killed>\d+)/.exec(msg)
        if (resultResult?.groups) {
          this.getCurrentShot()!.result = {
            killed: Number(resultResult.groups.killed),
            score: Number(resultResult.groups.score),
          }

          const { id } = this.getCurrentTry()!
          if (this.levels.has(id)) {
            this.levels.get(id)!.maxScore = Math.max(
              this.levels.get(id)!.maxScore,
              Number(resultResult.groups.score)
            )
          } else {
            this.levels.set(id, {
              id,
              tries: 1,
              shots: [],
              maxScore: Number(resultResult.groups.score),
            })
          }
        } else if (msg.includes("ShotSelection - Available targets:")) {
          const newShot = { candidates: [] }
          this.getCurrentTry()?.shots.push(newShot)
          this.getCurrentLevel()?.shots.push(newShot)
          this.getCurrentTry()?.chronology.push({ type: "shot", data: newShot })
        } else if (msg.includes("Meta - Current GameState is ")) {
          const statusResult =
            /Meta - Current GameState is (?<status>[A-Z]+)/.exec(msg)
          if (statusResult?.groups) {
            /* Include state change in Chronology: levelTries.at(-1)?.chronology.push({
              type: "string",
              data: "State > " + statusResult?.groups.status,
            }) */
            this.getCurrentTry()!.result = statusResult?.groups.status
          }
        } else if (msg.includes("CaseBasedReasoning - expected")) {
          this.getCurrentTry()?.chronology.push({ type: "string", data: msg })

          const result =
            /CaseBasedReasoning - expected: (?<expectedDestroyed>Destroyed[^[]*\[[^;]*]*);(?<expectedMoved>Moved[^[]*\[[^\]]*]*), actual: (?<actualDestroyed>Destroyed[^[]*\[[^;]*]*);(?<actualMoved>Moved[^[]*\[[^\]]*]*)/.exec(
              msg
            )
          if (!result?.groups) return

          const effect = {
            actual: {
              destroyed: result.groups.actualDestroyed,
              moved: result?.groups.actualMoved,
            },
            expected: {
              destroyed: result.groups.expectedDestroyed,
              moved: result?.groups.expectedMoved,
            },
          }
          if (this.newCBRCases.get(this.lastCaseID ?? "-1")?.uses.at(-1))
            this.newCBRCases.get(this.lastCaseID ?? "-1")!.uses.at(-1)!.effect =
              effect
        } else if (msg.includes("loaded case")) {
          const caseResult =
            /Meta - CBR_DEBUG loaded case: CBR-Case: (?<id>\d+), .*/.exec(msg)
          if (caseResult?.groups) {
            /* Include Loaded Cases in Chronology: levelTries.at(-1)?.chronology.push({
              type: "string",
              data: "State > " + statusResult?.groups.status,
            }) */
            const id = caseResult?.groups.id
            this.lastCaseID = caseResult?.groups.id

            // eslint-disable-next-line max-depth
            if (this.newCBRCases.has(id)) {
              this.newCBRCases.get(id)?.uses.push({
                level: String(this.getCurrentTry()?.id),
                shotNumber: this.getCurrentTry()?.shots.length ?? -1,
                killed: this.getCurrentShot()?.result?.killed ?? -1,
              })
            } else {
              this.newCBRCases.set(id, {
                id,
                uses: [
                  {
                    level: String(this.getCurrentTry()?.id),
                    shotNumber: this.getCurrentTry()?.shots.length ?? -1,
                    killed: this.getCurrentShot()?.result?.killed ?? -1,
                  },
                ],
              })
            }
          }

          this.getCurrentTry()?.chronology.push({ type: "string", data: msg })
        }
      }
    }
  }

  addMultipleLines(lines: string[]) {
    lines.forEach((line) => {
      this.addLine(line)
    })
  }
}
