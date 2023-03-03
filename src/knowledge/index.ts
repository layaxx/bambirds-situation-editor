import type { ABObject } from "objects/angryBirdsObject"
import { generatorStore } from "stores/generatorStore"

export function getRelationsBetweenTwoObjects(
  object1: ABObject,
  object2: ABObject
) {
  const generator = generatorStore.get()

  const x = generator.getRelationX(object1, object2)
  const y = generator.getRelationY(object1, object2)
  const misc = generator.getMiscRelation(object1, object2)
  console.log({ x, y, misc })
  return { x, y, misc }
}

export function clearEOPRA(svg: SVGElement) {
  ;[...svg.children].forEach((element) => {
    console.log(svg.getAttribute("id"))
    if (element.getAttribute("id")?.includes("EOPRA")) element.remove()
  })
}

export function drawEOPRA(object: ABObject | undefined, svg: SVGElement) {
  if (!object) return

  const $group = document.createElementNS("http://www.w3.org/2000/svg", "g")
  $group.setAttribute("id", "EOPRA" + object.id)

  for (let i = 0; i < 6; i++) {
    const $circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    )
    $circle.setAttribute("cx", String(object.x))
    $circle.setAttribute("cy", String(object.y))
    $circle.setAttribute("r", String(Math.abs((i + 1) * 29.2)))
    $circle.setAttribute("style", `fill:None;stroke:black;stroke-width:1`)

    $group.append($circle)
  }

  for (let i = -6; i < 6; i++) {
    if (![1, 2, 4, 5].includes(Math.abs(i))) continue
    const $line = document.createElementNS("http://www.w3.org/2000/svg", "line")

    const angle = (Math.PI / 6) * i

    const x2 = object.x + 200 * Math.cos(angle)
    const y2 = object.y + 200 * Math.sin(angle)

    $line.setAttribute("x1", String(object.x))
    $line.setAttribute("y1", String(object.y))
    $line.setAttribute("x2", String(x2))
    $line.setAttribute("y2", String(y2))

    $line.setAttribute("style", `fill:None;stroke:black;stroke-width:1`)

    $group.append($line)
  }

  svg.append($group)
}
