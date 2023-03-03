import levels from "./levels/index"
import { ABObject } from "./objects/angryBirdsObject"
import { footer } from "./output/createElements/footer"
import header from "./output/createElements/header"
import { container } from "./output/createElements/levels/container"
import { main } from "./output/createElements/main"
import { drawGrid } from "./output/svg"
import parseLevel, { levelDimensions } from "./parser/levelParser"

console.log("Loaded levels.ts")

type AnalysisObject = {
  material?: string
  shape?: string
  form?: string
  levelID: number
}

function init() {
  new EventSource("/esbuild").addEventListener("change", () => {
    location.reload()
  })

  const $container = container()

  document
    .querySelector("body")
    ?.append(
      header({ active: "/levels.html" }),
      main({ children: $container }),
      footer()
    )

  const analysis: Array<{
    amount: number
    objects: AnalysisObject[]
    birds: ABObject[]
    pigs: ABObject[]
  }> = []

  levels.forEach((level, index) => {
    const { objects } = parseLevel(level)
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
      `${minX - buffer} ${400 - xHeight} ${maxX - minX + 2 * buffer} ${xHeight}`
    )

    newSVG.setAttribute("transform", `translate(0 ${0})`)
    const newSVGWrapper = document.createElement("div")
    newSVGWrapper.setAttribute(
      "style",
      "overflow: hidden; padding: 0; width: 33.3%; height: auto; border: 2px solid black;"
    )

    drawGrid(newSVG, { height, width })
    objects.forEach((object) => {
      object.render(newSVG)
    })

    /* Text:     const text = document.createElementNS("http://www.w3.org/2000/svg", "text")
    text.textContent = String(minY)
    text.setAttribute("x", "150")
    text.setAttribute("y", "300")
    text.setAttribute("style", "font: bold 40px sans-serif;")
    newSVG.append(text) */

    newSVGWrapper.append(newSVG)

    analysis.push(analyzeLevel(objects, 1 + index))

    $container.append(newSVGWrapper)
  })
}

function analyzeLevel(objects: ABObject[], levelID: number) {
  const birds = objects.filter((object) => object.isBird)
  const pigs = objects.filter((object) => object.isPig)
  objects = objects.filter(
    (object) => object.color !== "black" && !object.isBird
  )

  return {
    amount: objects.length,
    objects: objects.map(({ material, shape, form }) => ({
      material,
      shape,
      form,
      levelID,
    })),
    birds,
    pigs,
  }
}

init()
