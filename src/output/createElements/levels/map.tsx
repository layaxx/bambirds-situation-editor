import levels from "data/levels"
import { ABObject } from "objects/angryBirdsObject"
import { drawGrid } from "output/svg"
import parseLevel, { levelDimensions } from "parser/levelParser"

export const levelMap: JSX.Component<{
  id?: number
  objects?: ABObject[]
  noGrid?: boolean
  omitBirds?: boolean
  scaleFactor?: number
}> = (props) => {
  let objects: ABObject[] = []
  if (props.id === undefined) {
    if (props.objects === undefined) return undefined as unknown as Element
    objects = props.objects
  } else {
    if (!levels.at(props.id + 1)) return undefined as unknown as Element

    objects = parseLevel(levels.at(props.id - 1)!).objects
  }

  if (props.omitBirds) objects = objects.filter((object) => !object.isBird)

  const { minX, maxX, minY, maxY } = levelDimensions(objects)

  const height = 500
  const width = 1000
  const buffer = 10
  const newSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  newSVG.setAttribute("height", "8rem")
  newSVG.setAttribute("width", "100%")
  newSVG.setAttribute("preserveAspectRatio", "xMidYMax")
  const xHeight = maxY - minY
  newSVG.setAttribute(
    "viewBox",
    `${minX - ((props.scaleFactor ?? 2) / 2) * buffer} ${
      400 - xHeight - buffer
    } ${maxX - minX + (props.scaleFactor ?? 2) * buffer} ${xHeight}`
  )

  newSVG.setAttribute("transform", `translate(0 ${0})`)
  const newSVGWrapper = document.createElement("div")
  newSVGWrapper.setAttribute(
    "style",
    "overflow: hidden; padding: 0; height: auto; border: 2px solid black;"
  )

  if (!props.noGrid) drawGrid(newSVG, { height, width, skip: minX })
  objects.forEach((object) => {
    object.render(newSVG)
  })

  newSVGWrapper.append(newSVG)

  return newSVGWrapper
}
