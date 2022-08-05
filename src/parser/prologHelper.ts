/**
 * Parses a generic Prolog predicate and returns a list of the name and all parameters
 *
 * @param predicate - string representation of the prolog predicate
 * @returns array of name and all parameters
 */
export function getGenericValues(
  predicate: string | undefined
): Array<string | number | number[]> {
  if (!predicate) {
    console.error("Cannot determine values of undefined")
    return []
  }

  const name = predicate.split("(")[0]

  predicate = "[" + predicate.replace(name + "(", "").replace(").", "") + "]"

  const args = JSON.parse(
    predicate.replace(/(['"])?([a-zA-Z]\w+)(['"])?/g, '"$2"')
  ) as Array<string | number | number[]>

  return [name.trim(), ...args]
}
