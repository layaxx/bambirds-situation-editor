import { levelMap } from "components/levels/map"
import levels from "data/levels/index"
import type { ABObject } from "objects/angryBirdsObject"
import { footer } from "output/createElements/footer"
import header from "output/createElements/header"
import { main } from "output/createElements/main"
import parseLevel from "parser/levelParser"
import jsx from "texsaur"

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

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const $container = jsx("div", {
    style: "display:grid; grid-template-columns: auto auto auto;",
  })

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

    analysis.push(analyzeLevel(objects, 1 + index))

    const map = levelMap({ objects })

    $container.append(map)
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
