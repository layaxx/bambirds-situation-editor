import { Store } from "./store"

const idStore: Store<number> = new Store(0)

/**
 * Returns the current value of a counter and increases counter,
 * i.e. returns strictly increasing values on each call
 */
export function getUID(): number {
  const uuidCounter = idStore.get()
  idStore.set(uuidCounter + 1)
  return uuidCounter
}
