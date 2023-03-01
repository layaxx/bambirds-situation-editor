import { ABObject } from "../objects/angryBirdsObject"
import { deepCopy } from "../objects/helper"
import { Store } from "./store"

export const objectStore: Store<ABObject[]> = new Store([] as ABObject[])
export const selectedObjectStore: Store<ABObject[]> = new Store(
  [] as ABObject[]
)

export const previousSelectedObjectStore: Store<ABObject[]> = new Store(
  [] as ABObject[]
)
const backup: Store<ABObject[]> = new Store([] as ABObject[])

export function makeBackup() {
  backup.set(deepCopy([...objectStore.get()]))
}

export function recoverBackup() {
  objectStore.set(backup.get())
  console.log("Recovering backup")
  selectedObjectStore.set([])

  objectStore.set(backup.get())
}
