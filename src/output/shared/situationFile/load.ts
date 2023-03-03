import parse from "parser/situationFileParser"
import { objectStore } from "stores/objects"
import { sceneStore } from "stores/scene"

export const loadSituationFile = (value: string) => {
  const loadResult = parse(value)
  objectStore.set(loadResult.objects)
  sceneStore.set(loadResult.scene)
}
