import { watch } from "fs";

async function rebuild() {
  performance.now();
  const startTime = performance.now();
  let build = await Bun.build({
    entrypoints: ["./src/NibroSuite.ts"],
    root: "./src",
    outdir: "./build",
    // minify: {
    //   whitespace: true,
    //   identifiers: false,
    //   syntax: true,
    // },
    splitting: false,
    target: "browser",
    external: ["underscore"],
  });
  const endTime = performance.now();
  if (build.success) {
    console.log(`built in ${(endTime - startTime) / 1000} seconds!`);
  } else {
    build.logs.forEach(console.error);
  }
}

console.log("building...");
await rebuild();
const watcher = watch(import.meta.dir + "/src", rebuild);
