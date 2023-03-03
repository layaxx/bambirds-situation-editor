import { footer } from "../output/createElements/footer"
import header from "../output/createElements/header"
import { main } from "../output/createElements/main"

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
