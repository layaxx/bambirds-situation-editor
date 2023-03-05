import LevelState from "parser/logFile/state"
import jsx from "texsaur"
import { levelTry as levelTryComponent } from "./levelTry"

export const timeline: JSX.Component<{ state: LevelState }> = ({ state }) => {
  const $container = (
    <div class="timeline">
      <h2>Chronology:</h2>
    </div>
  )
  Promise.all(
    state.levelTries.map(async (levelTry) => levelTryComponent({ levelTry }))
  ).then(
    (elements) => {
      $container.append(...elements)
    },
    () => {
      console.error("Failed to generate Timeline")
    }
  )

  return $container
}
