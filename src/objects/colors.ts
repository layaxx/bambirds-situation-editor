export const TNT_COLOR = "#E6E600" as const
export const PORK_COLOR = "#1AFF1A" as const
export const WOOD_COLOR = "#E6991A" as const
export const STONE_COLOR = "#808080" as const
export const ICE_COLOR = "#99B3FF" as const
export const FALLBACK_COLOR = "lightgray" as const

export const HORIZON_LINE_COLOR = "red" as const

export const CIRCLE_STROKE_COLOR = "black" as const
export const SELECTED_OBJECT_COLOR = "purple" as const
export const GRID_COLOR = "rgb(50,50,50)" as const

export const SELECTION_RECTANGLE_COLOR = "purple" as const
export const CENTER_CROSS_COLOR = "black" as const

export function getColorFromMaterial(
  material: string | undefined
): string | undefined {
  switch (material) {
    case "ice":
      return ICE_COLOR
    case "stone":
      return STONE_COLOR
    case "wood":
      return WOOD_COLOR
    case "pork":
      return PORK_COLOR
    case "tnt":
      return TNT_COLOR
    case undefined:
      return undefined
    default:
      return FALLBACK_COLOR
  }
}
