import jsx from "texsaur"

export const indexImports = () => {
  return (
    <>
      <div>
        <p>
          Paste the content of a situationX-Y.pl file here, then click on any
          other element.
        </p>
        <div class="grid">
          <div>
            <label>Input Situation.pl</label>
            <textarea id="situationfile" rows="10" cols="50"></textarea>
          </div>
          <div>
            <label>Output:</label>
            <textarea id="output" rows="10" cols="50"></textarea>
          </div>
        </div>
      </div>
      <div class="grid">
        <div>
          <select id="loadFromLevel"></select>
        </div>
        <div>
          <input
            type="checkbox"
            id="keepDerivedPredicates"
            name="keepDerivedPredicates"
            checked
          />
          <label for="keepDerivedPredicates"> Keep derived Predicates</label>
          <input type="button" id="exportButton" value="save changes" />
        </div>
      </div>
    </>
  )
}
