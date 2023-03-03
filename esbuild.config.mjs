import * as esbuild from "esbuild"

const ctx = await esbuild.context({
  logLevel: "info",
  entryPoints: [
    "src/app.ts",
    "src/levels.ts",
    "src/knowledgeEntry.ts",
    "src/entryPoints/analysis.ts",
  ],
  bundle: true,
  outdir: "build",
  sourcemap: true,
  external: ["fs", "path"],
})

await ctx.watch()

await ctx.serve({
  servedir: ".",
  port: 7000,
  host: "127.0.0.1",
})
