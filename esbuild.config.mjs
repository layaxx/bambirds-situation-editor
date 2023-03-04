import * as esbuild from "esbuild"
import { globSync } from "glob"

const ctx = await esbuild.context({
  logLevel: "info",
  entryPoints: globSync("src/entryPoints/**/*.{ts,tsx,js,jsx}"),
  bundle: true,
  outdir: "build",
  sourcemap: true,
  external: ["fs", "path"],
  loader: { ".log": "text" },
})

await ctx.watch()

await ctx.serve({
  servedir: ".",
  port: 7000,
  host: "127.0.0.1",
})
