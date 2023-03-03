import jsx from "texsaur"

export const knowledgeImports = () => {
  return (
    <>
      <div>
        <p>
          Paste the content of a situationX-Y.pl file here, then click on any
          other element.
        </p>
        <div class="grid">
          <div>
            <label>Load from Situation</label>
            <textarea id="situationfile" rows="10" cols="50"></textarea>
          </div>
          <div>
            <label>Load from Level</label>
            <select id="loadFromLevel"></select>

            <button id="clear-overlay">Clear Overlay</button>
          </div>
        </div>
      </div>

      <div class="grid">
        <div>
          <label>RelationGenerator</label>
          <select id="generator-select"></select>
        </div>
        <button id="generate-predicates">Generate Predicates</button>
      </div>
    </>
  )
}
