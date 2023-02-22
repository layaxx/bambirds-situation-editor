import levels from "./levels/index"
import { ABObject } from "./objects/angryBirdsObject"
import { drawGrid, drawHorizontalLine } from "./output/svg"
import parseLevel, { levelDimensions } from "./parser/levelParser"

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

  const $container = document.querySelector<HTMLElement>("#levels")!
  if ($container === null) {
    console.error(
      "Failed to get required HTML Elements, missing at least one of $situationfile, $container, $output"
    )
    return
  }

  const analysis: Array<{
    amount: number
    objects: AnalysisObject[]
    birds: ABObject[]
    pigs: ABObject[]
  }> = []

  levels.forEach((level, index) => {
    const { objects, scene } = parseLevel(level)
    const { minX, maxX, minY, maxY } = levelDimensions(objects)

    const height = 500
    const width = 1000
    const buffer = 10
    const newSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    newSVG.setAttribute("height", "15rem")
    newSVG.setAttribute("width", "100%")
    newSVG.setAttribute(
      "viewBox",
      `${minX - buffer} ${minY - buffer} ${maxX - minX + 2 * buffer} ${
        maxY - minY + 2 * buffer
      }`
    )
    newSVG.setAttribute("style", "transform-origin: 0% 0%")
    const newSVGWrapper = document.createElement("div")
    newSVGWrapper.setAttribute(
      "style",
      "overflow: hidden; padding: 0; width: 50%; height: auto; border: 2px solid black;"
    )

    drawGrid(newSVG, { height, width })
    objects.forEach((object) => {
      object.render(newSVG)
    })

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text")
    text.textContent = `Level: 1-${1 + index}`
    text.setAttribute("style", "font: bold 40px sans-serif;")
    newSVG.append(text)

    drawHorizontalLine(scene.groundY, newSVG, { width })

    newSVGWrapper.append(newSVG)

    analysis.push(analyzeLevel(objects, 1 + index))

    $container.append(newSVGWrapper)
  })

  console.log(
    "entities",
    analysis.map((result) => result.objects.length)
  )
  console.log(
    "birds",
    analysis.map((result) => result.birds.length)
  )
  console.log(
    "pigs",
    analysis.map((result) => result.pigs.length)
  )
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
