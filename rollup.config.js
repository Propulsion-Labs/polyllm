import path from 'path';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

export default [
  // JS build
  {
    input: ['src/index.ts', 'src/agents/index.ts'], // Add any sub-entries here
    output: {
      dir: 'dist',
      format: 'esm',
      preserveModules: true,
    //   preserveModulesRoot: 'src', // Keeps paths like dist/agents/
    },
    plugins: [typescript({ tsconfig: './tsconfig.json' })],
    external: [ 'openai' ], // Add dependencies here if needed (e.g., ['fs', 'path'])
  },

  // .d.ts build
  {
    input: ['src/index.ts', 'src/agents/index.ts'],
    output: {
      dir: 'dist',
      preserveModules: true,
    //   preserveModulesRoot: 'src',
    },
    plugins: [dts()],
  }
];
