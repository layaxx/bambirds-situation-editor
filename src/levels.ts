import levels from "./levels/index"
import { ABObject } from "./objects/angryBirdsObject"
import { drawGrid, drawHorizontalLine } from "./output/svg"
import parseLevel from "./parser/levelParser"

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

  const analysis: Array<{ amount: number }> = []

  levels.forEach((level, index) => {
    const { objects, scene } = parseLevel(level)

    const height = 500
    const width = 1000
    const newSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    newSVG.setAttribute("height", "15rem")
    newSVG.setAttribute("width", "100%")
    newSVG.setAttribute("viewBox", `0 0 ${width} ${height}`)
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

  console.log(analysis.flatMap((result) => result.objects))
}

function analyzeLevel(objects: ABObject[], levelID: number) {
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
  }
}

init()
