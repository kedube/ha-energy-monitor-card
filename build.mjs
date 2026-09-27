import * as esbuild from "esbuild";

const serve = process.argv.includes("--serve");

const options = {
  entryPoints: ["src/energy-monitor-card.ts"],
  bundle: true,
  format: "esm",
  target: "es2021",
  outfile: "dist/energy-monitor-card.js",
  minify: !serve,
  sourcemap: serve ? "inline" : false,
  // The dev server builds in memory so the committed dist/ bundle stays a production build.
  write: !serve,
  legalComments: "none",
  logLevel: "info",
};

if (serve) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  const { port } = await ctx.serve({ servedir: ".", host: "127.0.0.1", port: 9123 });
  console.log(`Demo: http://localhost:${port}/demo/`);
} else {
  await esbuild.build(options);
}
