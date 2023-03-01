import { Scene } from "../types"
import { Store } from "./store"

export const sceneStore: Store<Scene | undefined> = new Store<
  Scene | undefined
>(undefined)
