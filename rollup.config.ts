import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import resolve from "@rollup/plugin-node-resolve";

const input = ["src/index.ts", "src/agents/index.ts"];

export default [
  // ESM build (.mjs)
  {
    input,
    output: {
      dir: "dist",
      format: "esm",
      preserveModules: true,
      entryFileNames: "[name].mjs",
    },
    plugins: [
      typescript({ tsconfig: "./tsconfig.json", module: "ESNext" }),
      resolve({
        extensions: [".js", ".ts"],
      }),
    ],
    external: ["openai"],
  },

  // CJS build (.cjs)
  {
    input,
    output: {
      dir: "dist",
      format: "cjs",
      preserveModules: true,
      entryFileNames: "[name].cjs",
    },
    plugins: [
      typescript({ tsconfig: "./tsconfig.json", module: "ESNext" }),
      resolve({
        extensions: [".js", ".ts"],
      }),
    ],
    external: ["openai"],
  },

  // .d.ts build
  {
    input,
    output: {
      dir: "dist",
      preserveModules: true,
      entryFileNames: "[name].d.ts",
    },
    plugins: [dts()],
  },
];
