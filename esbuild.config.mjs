import esbuildServe from "esbuild-serve"

esbuildServe(
  {
    logLevel: "info",
    entryPoints: ["src/app.ts"],
    bundle: true,
    outfile: "build/main.js",
    sourcemap: true,
  },
  { root: "./" }
)
