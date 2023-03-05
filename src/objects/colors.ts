/** Color used to display objects with material TNT */
export const TNT_COLOR = "#E6E600" as const
/** Color used to display objects with material PORK, i.e. pigs */
export const PORK_COLOR = "#1AFF1A" as const
/** Color used to display objects with material wood */
export const WOOD_COLOR = "#E6991A" as const
/** Color used to display objects with material stone */
export const STONE_COLOR = "#808080" as const
/** Color used to display objects with material ice */
export const ICE_COLOR = "#99B3FF" as const
/** Color used to display objects from a CBR case */
export const CBR_COLOR = "green" as const
/** Color used to display objects with unknown material */
export const FALLBACK_COLOR = "lightgray" as const

/** Color used to display the ground plane */
export const HORIZON_LINE_COLOR = "red" as const

/** Color used for stroke of circle and polygon objects */
export const CIRCLE_STROKE_COLOR = "black" as const
/** Color used as fill for selected objects */
export const SELECTED_OBJECT_COLOR = "purple" as const
/** Color used draw the background grid */
export const GRID_COLOR = "rgb(50,50,50)" as const

/** Color used for the stroke of the selection rectangle */
export const SELECTION_RECTANGLE_COLOR = "purple" as const
/** Color used to display the center cross */
export const CENTER_CROSS_COLOR = "black" as const

/**
 * Converts an object into a color. Uses a {@link FALLBACK_COLOR} if no better match is available.
 *
 * Returns undefined if given material is undefined
 *
 * @param material - material string that shall be converted to color. Can be undefined, then undefined is returned
 *
 * @returns undefined iff material is undefined, else an appropriate color string
 */
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
    case "cbr":
      return CBR_COLOR
    case "cbr_destroyed":
      return "red"
    case "cbr_moved":
      return "yellow"
    case undefined:
      return undefined
    default:
      return FALLBACK_COLOR
  }
}
