import esbuildServe from "esbuild-serve"

esbuildServe(
  {
    logLevel: "info",
    entryPoints: ["src/app.ts", "src/levels.ts"],
    bundle: true,
    outdir: "build",
    sourcemap: true,
  },
  { root: "./" }
)
