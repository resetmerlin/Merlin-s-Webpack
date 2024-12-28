/* eslint-disable @typescript-eslint/no-var-requires */
const glob = require('glob');
const path = require('path');
const packageJson = require('../package.json');
const fs = require('fs');

const workspaces = packageJson.workspaces;

const monorepoRoot = path.resolve(__dirname, '../');

const packageJsonFiles = workspaces.flatMap(workspace =>
  glob.sync(`${workspace}/package.json`, {
    cwd: monorepoRoot,
    ignore: ['**/node_modules/**', '**/.git/**', '**/.yarn/**'],
    absolute: true,
  })
);

const packageTable = new Map();

for (const packageJsonDir of packageJsonFiles) {
  const file = JSON.parse(fs.readFileSync(packageJsonDir, 'utf8'));

  const devDependencies = file.devDependencies ?? {};
  const dependencies = file.dependencies ?? {};

  packageTable.set(packageJsonDir, { ...devDependencies, ...dependencies });
}

const pkgListTable = new Map();

for (const value of packageTable.values()) {
  for (const [name, version] of Object.entries(value)) {
    if (!pkgListTable.has(name)) {
      pkgListTable.set(name, new Map());
    }

    const childMap = pkgListTable.get(name);

    childMap.set(version, childMap.get(version) + 1 || 1);
  }
}

for (const name of pkgListTable.keys()) {
  let duplisted = 0;

  const map = pkgListTable.get(name);

  for (const val of map.values()) {
    duplisted += val;
  }

  if (duplisted === 1) {
    pkgListTable.delete(name);
  }
}

const pkgDeps = new Map(Object.entries({ ...packageJson.devDependencies, ...packageJson.dependencies }));

for (const name of pkgListTable.keys()) {
  const map = pkgListTable.get(name);

  if (pkgDeps.has(name)) {
    if (map.size === 1 && map.has(pkgDeps.get(name))) return;
  }
}

console.log(pkgListTable);
console.log(pkgDeps);
console.log(packageJsonFiles);
