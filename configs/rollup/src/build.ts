import path from 'path';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import typescript from '@rollup/plugin-typescript';
import { EXTENSIONS, FORMAT } from './utils';

interface IBuildArgs {
  input: string;
  output: string;
  external: (pkg: string) => boolean;
  tsconfig: string;
}

export function buildCJS({ input, output, external, tsconfig }: IBuildArgs) {
  return buildJS({ input, output, format: FORMAT.NODE.TYPE, external, tsconfig });
}

export function buildESM({ input, output, external, tsconfig }: IBuildArgs) {
  return buildJS({ input, output, format: FORMAT.BROWSER.TYPE, external, tsconfig });
}

function buildJS({
  input,
  output,
  format,
  external,
  tsconfig,
}: IBuildArgs & {
  format: typeof FORMAT.NODE.TYPE | typeof FORMAT.BROWSER.TYPE;
}) {
  const isESMFormat = format === FORMAT.BROWSER.TYPE;

  return {
    input,
    external,
    output: [
      {
        format,
        ...(isESMFormat
          ? {
              dir: path.dirname(output),
              entryFileNames: `[name].${path.extname(output)}`,
              preserveModulesRoot: path.dirname(input),
            }
          : { file: output }),
      },
    ],
    plugins: [
      resolve({
        extensions: EXTENSIONS,
      }),
      commonjs(),
      typescript({ tsconfig }),
      babel({
        extensions: EXTENSIONS,
        babelHelpers: 'bundled',
        rootMode: 'upward',
        presets: ['@babel/preset-env', '@babel/preset-typescript'],
      }),
      json(),
    ],
    preserveModules: isESMFormat,
  };
}
