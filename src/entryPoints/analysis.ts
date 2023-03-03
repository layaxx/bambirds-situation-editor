import { footer } from "components/footer"
import header from "components/header"
import { main } from "components/main"

console.log("Loaded analysis.ts")

function init() {
  new EventSource("/esbuild").addEventListener("change", () => {
    location.reload()
  })

  const mainElement = main(undefined)
  document
    .querySelector("body")
    ?.append(header({ active: "/analysis.html" }), mainElement, footer())
}

init()
