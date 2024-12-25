import path from 'path';
import { builtinModules } from 'module';
import { handleCJSEntrypoint, handleESMEntrypoint } from './handle-entry';
import { EnchantPackageJson, ensure } from './utils';
import { buildCJS, buildESM } from './build';
import { readFileSync } from 'fs';

export default function enchantDefaultRollupConfig({ packageDir = './' }: { packageDir?: string }) {
  const packageJSON: EnchantPackageJson = JSON.parse(readFileSync(path.join(packageDir, 'package.json'), 'utf-8'));

  if (packageJSON.exports == null) {
    throw new Error('You need to specify exports field of package.json');
  }

  const entrypoints = Object.keys(packageJSON.exports).filter(removePackageJSON);

  return entrypoints.flatMap(entrypoint => {
    const cjsEntrypoint = path.resolve(
      packageDir,
      ensure(handleCJSEntrypoint(packageJSON.exports ?? null, entrypoint), 'CJS entrypoint not found')
    );
    const cjsOutput = path.resolve(
      packageDir,
      ensure(packageJSON?.output?.[entrypoint].require, 'CJS outputfile not found')
    );

    const esmEntrypoint = path.resolve(
      packageDir,
      ensure(handleESMEntrypoint(packageJSON.exports, entrypoint), 'ESM entrypoint not found')
    );
    const esmOutput = path.resolve(
      packageDir,
      ensure(packageJSON?.output?.[entrypoint].import, 'ESM outputfile not found')
    );

    return [
      buildCJS({
        input: cjsEntrypoint,
        output: cjsOutput,
        external: getExternal(packageJSON),
        tsconfig: packageJSON.tsconfig,
      }),
      buildESM({
        input: esmEntrypoint,
        output: esmOutput,
        external: getExternal(packageJSON),
        tsconfig: packageJSON.tsconfig,
      }),
    ];
  });
}

function removePackageJSON(key: string) {
  return key !== './package.json';
}

function getExternal(packageJSON: EnchantPackageJson) {
  return function external(pkg: string) {
    const dependencies = Object.keys(packageJSON.dependencies || {});
    const peerDependencies = Object.keys(packageJSON.peerDependencies || {});
    const externals = [...dependencies, ...peerDependencies, ...builtinModules];

    return externals.some(externalPkg => {
      return pkg.startsWith(externalPkg);
    });
  };
}
