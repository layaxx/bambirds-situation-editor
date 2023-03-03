import jsx from "texsaur"
import { navigation } from "./navigation"

type Props = {
  subtitle?: string
  active: string
}

export default function header({ subtitle, active }: Props) {
  return (
    <header>
      <h1>Visual Situation File Editor</h1>
      {subtitle && <h2>{subtitle}</h2>}

      {navigation({ active })}
    </header>
  )
}
