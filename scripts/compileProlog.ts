/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import fs from "node:fs"
import path from "node:path"
import SWIPL from "swipl-wasm/dist/swipl/swipl-bundle"

const entryPoint = path.join("prolog", "main.pl")
const srcDir = "prolog"
const outFile = path.join("src", "prolog", "index.ts")

async function buildProlog(): Promise<string> {
  // eslint-disable-next-line new-cap
  const module = await SWIPL({
    arguments: ["-f", entryPoint.replace(/\\/g, "/")],

    preRun: [
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      (module: SWIPLModule) => {
        const allFiles = getAllFiles(srcDir)

        const dirs = [
          ...new Set(
            allFiles.flatMap((file) => {
              file = file.replace(/\\/g, "/")
              return path
                .dirname(file)
                .split("/")
                .map((_, index, array) =>
                  array.slice(0, Number(index) + 1).join("/")
                )
            })
          ),
        ]

        dirs.forEach((dir) => module.FS.mkdir(dir))

        allFiles.forEach((file) =>
          module.FS.writeFile(file.replace(/\\/g, "/"), fs.readFileSync(file))
        )
      },
    ],
  })

  module.prolog.query("qsave_program('prolog.pvm')").once()
  return generateImageString(module.FS.readFile("prolog.pvm"))
}

function uint8ToString(u8a: Uint8Array) {
  const CHUNK_SZ = 0x80_00
  const c: string[] = []
  for (let i = 0; i < u8a.length; i += CHUNK_SZ) {
    c.push(
      String.fromCharCode.apply(null, u8a.subarray(i, i + CHUNK_SZ) as any)
    )
  }

  return c.join("")
}

async function generateImageString(
  buffer: string | Uint8Array
): Promise<string> {
  return btoa(typeof buffer === "string" ? buffer : uint8ToString(buffer))
}

async function writeProlog() {
  // FIXME: workaround with local files because they are missing from NPM package
  const content = `import {loadImage} from "./loadImage"
import strToBuffer from "./strToBuffer"

export default loadImage(strToBuffer("${await buildProlog()}"))`

  console.log("Generation complete")

  fs.writeFileSync(outFile, content)
}

const getAllFiles = function (dirPath: string, arrayOfFiles: string[] = []) {
  const files = fs.readdirSync(dirPath)

  files.forEach(function (file) {
    const newPath = path.join(dirPath, file)
    if (fs.statSync(newPath).isDirectory()) {
      arrayOfFiles = getAllFiles(newPath, arrayOfFiles)
    } else {
      arrayOfFiles.push(newPath)
    }
  })

  return arrayOfFiles
}

writeProlog().then(
  () => {
    console.log("Success")
  },
  () => {
    console.log("Failed to compile Prolog")
  }
)
