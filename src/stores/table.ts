import { TableElements } from "../types"
import { Store } from "./store"

export const tableStore: Store<TableElements | undefined> = new Store<
  TableElements | undefined
>(undefined)
