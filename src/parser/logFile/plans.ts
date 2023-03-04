import type { Shot } from "./state"

export function parsePlan(plan: string, shortForm = false): Plan {
  let re =
    /ShotSelection - Plan: +(?<target>\w+) @ angle +(?<angle>-?\d+) +strategy: (?<strategy>\w+)\s*Confidence: (?<confidence>\d+\.?\d*)\s+(Reasons: (?<reasons>.*) )?Shot:\s*(?<shot>.*)/
  if (shortForm) {
    re =
      /ShotSelection - Chosen target: +\(Plan (?<target>\w+):(?<strategy>[^:]+):(?<angle>-?\d+):(?<confidence>\d+\.?\d*):((?<reasons>\[.*]):)?(?<shot>.*)\)/
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  let matchResult: RegExpMatchArray | null = plan.match(re)

  if (!matchResult?.groups) {
    console.warn("Failed to parse plan: " + plan)
    matchResult = { groups: {} } as RegExpMatchArray
  }

  return {
    target: matchResult.groups?.target ?? "",
    angle: Number(matchResult.groups?.angle),
    strategy: matchResult.groups?.strategy ?? "",
    confidence: Number(matchResult.groups?.confidence),
    reasons: matchResult.groups?.reasons ?? "",
    shot: matchResult.groups?.shot ?? "",
  }
}

export function formatPlan(plan?: Plan): string {
  if (!plan) return "Unknown Plan"

  return `${plan.strategy}@${plan.target}`
}

export function formatResult(input?: Shot["result"]): string {
  return (input?.killed && `[killed ${input.killed}]`) || ""
}

export type Plan = {
  target: string
  angle: number
  strategy: string
  confidence: number
  reasons: string
  shot: string
}
