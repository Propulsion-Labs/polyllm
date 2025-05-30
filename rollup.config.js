import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

export default [
  // ESM
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.mjs',
      format: 'esm',
    },
    plugins: [typescript({ tsconfig: './tsconfig.json', module: 'ESNext' })],
    external: ['openai'],
  },

  // CJS
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.cjs',
      format: 'cjs',
    },
    plugins: [typescript({ tsconfig: './tsconfig.json', module: 'ESNext' })],
    external: ['openai'],
  },

  // Types
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
    },
    plugins: [dts()],
  },
];
