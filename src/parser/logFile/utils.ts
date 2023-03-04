import type { Use } from "./state"

export function successfulUse(use: Use): string {
  const destroyedIdsExpected = use.effect?.expected.destroyed
    .replace("]", "")
    .split("[")
    .at(-1)
    ?.split(",")
    .map((string) => string.trim())

  const destroyedIdsActual = use.effect?.actual.destroyed
    .replace("]", "")
    .split("[")
    .at(-1)
    ?.split(",")
    .map((string) => string.trim())

  const pigs = destroyedIdsExpected?.filter((id) => id.includes("pig"))

  if (pigs?.every((pig) => destroyedIdsActual?.includes(pig))) return "complete"

  if (pigs?.some((pig) => destroyedIdsActual?.includes(pig))) return "partial"

  return "no"
}
