import jsx from "texsaur"

export const cbrAnalysis = () => {
  return (
    <div>
      <p>Case Analysis</p>
      <small>
        Analysis of cases in this webapp ignores possible obstacles to shot.
        i.e. not applicable === "definitely not applicable"; applicable ===
        "applicable iff free shot possible"
      </small>
      <button id="cases-analyze">Analyze Cases</button>
      <div class="grid">
        <button id="cases-hide-all">Hide all</button>
        <button id="cases-show-all">Show all</button>
      </div>
      <div id="analysis-results"></div>
    </div>
  )
}
