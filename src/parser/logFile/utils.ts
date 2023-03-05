import type { Effects } from "./state"

export function successfulUse(use: { effect?: Effects }): string {
  const destroyedIdsExpected = idsFromArrayString(
    use.effect?.expected.destroyed ?? ""
  )

  const destroyedIdsActual = idsFromArrayString(
    use.effect?.actual.destroyed ?? ""
  )

  const pigs = destroyedIdsExpected?.filter((id) => id.includes("pig"))

  if (use.effect === undefined || pigs?.length === 0) return "no (unclear)"

  if (pigs?.every((pig) => destroyedIdsActual?.includes(pig))) return "complete"

  if (pigs?.some((pig) => destroyedIdsActual?.includes(pig))) return "partial"

  return "no"
}

export function idsFromArrayString(arrayString: string) {
  return arrayString
    .replace("]", "")
    .split("[")
    .at(-1)
    ?.split(",")
    .map((string) => string.trim())
}
