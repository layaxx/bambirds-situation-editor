import { SelectionMeta } from "types"
import { Store } from "./store"

const selectionMeta: SelectionMeta = {
  scale: 1,
}

export const selectionMetaStore: Store<SelectionMeta> = new Store(selectionMeta)
