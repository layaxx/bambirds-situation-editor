import LevelState from "parser/logFile/state"
import jsx from "texsaur"
import { levelTry as levelTryComponent } from "./levelTry"

export const timeline: JSX.Component<{ state: LevelState }> = ({ state }) => {
  return (
    <div class="timeline">
      <h2>Chronology:</h2>
      {state.levelTries.map((levelTry) => levelTryComponent({ levelTry }))}
    </div>
  )
}
