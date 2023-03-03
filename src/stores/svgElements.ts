import { SVGElements } from "types"
import { Store } from "./store"

export const svgStore: Store<SVGElements | undefined> = new Store<
  SVGElements | undefined
>(undefined)
