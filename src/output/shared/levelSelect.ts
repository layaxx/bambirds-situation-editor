import levels from "data/levels"
import parseLevel from "parser/levelParser"
import { objectStore } from "stores/objects"
import { sceneStore } from "stores/scene"

export function setupLevelSelection(
  $levelSelect: HTMLElement,
  defaultHandler: CallableFunction
) {
  const option = document.createElement("option")
  option.text = `Load from Level`
  option.value = "-1"
  $levelSelect.append(option)

  for (let index = 1; index <= levels.length; index++) {
    const option = document.createElement("option")
    option.text = `Level1-${index}`
    option.value = String(index - 1)

    $levelSelect.append(option)
  }

  $levelSelect.addEventListener("change", (event) => {
    if (event?.target) {
      const value = Number((event.target as HTMLSelectElement).value)

      if (value > -1 && levels.at(value)) {
        const result = parseLevel(levels.at(value)!)
        objectStore.set(result.objects)
        sceneStore.set(result.scene)
      }

      if (value === -1) defaultHandler()
    }
  })
}
