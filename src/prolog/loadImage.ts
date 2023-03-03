// This file is copied from https://github.com/SWI-Prolog/npm-swipl-wasm
// because ot is missing from the npm package

import SWIPL, { SWIPLModule } from "swipl-wasm/dist/swipl/swipl-bundle"

export function loadImage(image: string | Buffer | Uint8Array) {
  return (options?: any | undefined) =>
    SWIPL({
      ...options,
      arguments: ["-q", "-x", "image.pvm"],
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      preRun: [
        (module: SWIPLModule) => module.FS.writeFile("image.pvm", image),
      ],
    })
}
