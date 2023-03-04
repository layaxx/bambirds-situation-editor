import jsx from "texsaur"

export const analysisImports: JSX.Component<{
  options: Array<{ id: string }>
  changeHandler: (this: GlobalEventHandlers, ev: Event) => any
}> = ({ options, changeHandler }) => {
  return (
    <>
      <div class="grid">
        <div>
          <select onchange={changeHandler}>
            {options.map((option, idx) => (
              <option value={idx}>{option.id}</option>
            ))}
          </select>
        </div>
        <div></div>
      </div>
    </>
  )
}
