import { writeFileSync } from "node:fs"
import { sep } from "node:path"
import { globSync } from "glob"

const files = globSync("data/logs/*/client.log")

const content = `
${files
  .map((file) => `import ${makeID(file)} from "${file.replace(/\\/g, "/")}"`)
  .join("\n")}

const logs = [${files
  .map((file) => `{id:"${makeID(file)}",content:${makeID(file)}}`)
  .join(",")}]

export default logs`

writeFileSync("data/logs/index.ts", content)

function makeID(filename: string): string {
  return "log" + String(filename.split(sep).at(-2)?.replace(/-/g, ""))
}
