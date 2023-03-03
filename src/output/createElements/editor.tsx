import jsx from "texsaur"

export const editor = () => {
  return (
    <>
      <p class="grid">
        <input
          type="range"
          min="1"
          max="500"
          value="100"
          class="slider"
          id="zoomRange"
        />
        <span>
          <span id="zoomValue">100%</span> SVG-Zoom-Level
        </span>
      </p>
      <div style="overflow: hidden; width: 100%; height: auto; padding: 0">
        <svg
          height="500"
          width="1000"
          id="container"
          style="background-color: white"
        ></svg>
      </div>
    </>
  )
}

export const table = () => {
  return (
    <div class="grid">
      <div>
        <p>
          Selected: <span id="selected-object-id"></span>
        </p>
        <div class="grid">
          <label>
            X Coordinate: <input type="number" id="selected-object-x" />
          </label>
          <label>
            Y Coordinate: <input type="number" id="selected-object-y" />
          </label>
        </div>
        <div class="grid">
          <label>
            Scale:
            <input type="number" id="selected-object-s" min="0" step="0.1" />
          </label>
          <label>
            Angle: <input type="number" id="selected-object-a" step="0.1" />
          </label>
        </div>
      </div>
    </div>
  )
}

export const controls = () => {
  return (
    <>
      <table role="grid">
        <thead>
          <tr>
            <th>Controls</th>
            <th>With Objects Selected</th>
            <th>No Objects Selected</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>left click</td>
            <td>select object</td>
          </tr>
          <tr>
            <td>(selected) left drag</td>
            <td>move object(s) [hold Ctrl for snap-to-grid]</td>
          </tr>
          <tr>
            <td>ctrl + d</td>
            <td>duplicate object</td>
          </tr>
          <tr>
            <td>ctrl + z</td>
            <td>
              reset objects to last recorded state. states are recorded when
              object selection changes and at least one object is selected
            </td>
          </tr>
          <tr>
            <td>←/→/↑/↓</td>
            <td>move selected object [hold Ctrl for higher speed]</td>
            <td>Move Canvas (when zoomed)</td>
          </tr>
          <tr>
            <td>[ALT] + ←/→</td>
            <td>rotate selected object [hold Ctrl for higher speed]</td>
          </tr>
          <tr>
            <td>[ALT] + ↑/↓</td>
            <td>scale selected object [hold Ctrl for higher speed]</td>
          </tr>
        </tbody>
      </table>
      <small>
        Note that scaling multiple objects to low values (circa &lt; 0.3) may
        cause them to lose their constellation. Also, scaling of multiple
        objects to &lt; 0.1 is disabled.
      </small>
    </>
  )
}
