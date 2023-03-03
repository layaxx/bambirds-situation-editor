import jsx from "texsaur"

export const grid: JSX.Component<{ children: Element[] }> = ({ children }) => {
  return <div class="grid">{children}</div>
}
