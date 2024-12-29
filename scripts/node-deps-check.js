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

    const pkgVersion = pkgDeps.get(name);

    const directoryLists = retrieveDir(name);

    for (const dir of directoryLists) {
      const package = JSON.parse(fs.readFileSync(dir, 'utf-8'));

      if (package.dependencies?.[name]) {
        package.dependencies[name] = 'workspace:*';
      } else if (package.devDependencies?.[name]) {
        package.devDependencies[name] = 'workspace:*';
      }

      fs.writeFileSync(dir, JSON.stringify(package, null, 2), 'utf8');
    }
  }
}

function retrieveDir(name) {
  const stack = [];
  for (const key of packageTable.keys()) {
    const map = packageTable.get(key);

    if (map[name]) {
      stack.push(key);
    }
  }

  return stack.filter(val => val !== path.join(monorepoRoot, 'package.json'));
}
