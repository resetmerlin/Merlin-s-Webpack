import path from 'path';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import { EXTENSIONS, FORMAT } from './utils';

interface IBuildArgs {
  input: string;
  output: string;
  external: boolean;
}

export function buildCJS({ input, output, external }: IBuildArgs) {
  return buildJS({ input, output, format: FORMAT.NODE.TYPE, external });
}

export function buildESM({ input, output, external }: IBuildArgs) {
  return buildJS({ input, output, format: FORMAT.BROWSER.TYPE, external });
}

function buildJS({
  input,
  output,
  format,
  external,
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
              preserveModulesRoot: isESMFormat ? path.dirname(input) : undefined,
            }
          : { file: output }),
      },
    ],
    plugins: [
      resolve({
        extensions: EXTENSIONS,
      }),
      commonjs(),
      babel({
        extensions: EXTENSIONS,
        babelHelpers: 'bundled',
        rootMode: 'upward',
      }),
      json(),
    ],
    preserveModules: isESMFormat,
  };
}
