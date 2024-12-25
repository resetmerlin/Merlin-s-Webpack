import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { babel } from '@rollup/plugin-babel';
import { builtinModules } from 'module';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.cjs',
      format: 'cjs',
      exports: 'named',
      sourcemap: true,
    },
    {
      file: 'dist/index.mjs',
      format: 'esm',
      sourcemap: true,
    },
  ],
  external: [...builtinModules, /node_modules/, /__test__/],
  plugins: [
    resolve({
      extensions: ['.js', '.ts'],
    }),
    commonjs(),
    json(),
    typescript({ tsconfig: './tsconfig.json' }),
    babel({
      extensions: ['.js', '.ts'],
      babelHelpers: 'bundled',
      presets: ['@babel/preset-env', '@babel/preset-typescript'],
    }),
  ],
};
