import path from 'path';
import builtinModules from 'builtin-modules';
import { PackageJson } from 'type-fest';
import { handleCJSEntrypoint, handleESMEntrypoint } from './handle-entry';
import { ensure } from './utils';
import { buildCJS, buildESM } from './build';

exports.enchantDefaultRollupConfig = function enchantDefaultRollupConfig({
  packageDir = './',
}: {
  packageDir?: string;
}) {
  const packageJSON: PackageJson = require(path.join(packageDir, 'package.json'));

  if (packageJSON.exports == null) {
    throw new Error('You need to specify exports field of package.json');
  }

  const entrypoints = Object.keys(packageJSON.exports).filter(removePackageJSON);

  const external = (pkg: string) => {
    const dependencies = Object.keys(packageJSON.dependencies || {});
    const peerDependencies = Object.keys(packageJSON.peerDependencies || {});
    const externals = [...dependencies, ...peerDependencies, ...builtinModules];

    return externals.some(externalPkg => {
      return pkg.startsWith(externalPkg);
    });
  };

  return entrypoints.flatMap(entrypoint => {
    const cjsEntrypoint = path.resolve(
      packageDir,
      ensure(handleCJSEntrypoint(packageJSON.exports ?? null, entrypoint), 'CJS entrypoint not found')
    );
    const cjsOutput = path.resolve(
      packageDir,
      ensure(packageJSON?.exports?.[entrypoint].require as string, 'CJS outputfile not found')
    );

    const esmEntrypoint = path.resolve(
      packageDir,
      ensure(handleESMEntrypoint(packageJSON.exports, entrypoint), 'ESM entrypoint not found')
    );
    const esmOutput = path.resolve(
      packageDir,
      ensure(packageJSON?.exports?.[entrypoint].import, 'ESM outputfile not found')
    );

    return [
      buildCJS({ input: cjsEntrypoint, output: cjsOutput, external }),
      buildESM({ input: esmEntrypoint, output: esmOutput, external }),
    ];
  });
};

function removePackageJSON(key: string) {
  return key !== './package.json';
}
