/* eslint-disable @typescript-eslint/no-var-requires */
const glob = require('glob');
const path = require('path');
const packageJson = require('../package.json');
const fs = require('fs');
const chalk = require('chalk');
const inquirer = require('inquirer');

const workspaces = packageJson.workspaces;

const monorepoRoot = path.resolve(__dirname, '../');

const depTypeOptions = [
  { name: 'dependency', value: 'dependencies' },
  { name: 'devDependency', value: 'devDependencies' },
];

const packagePathLists = workspaces.flatMap(workspace =>
  glob.sync(`${workspace}/package.json`, {
    cwd: monorepoRoot,
    ignore: ['**/node_modules/**', '**/.git/**', '**/.yarn/**'],
    absolute: true,
  })
);

const dependencyPerPackageTable = new Map();

for (const packageJsonDir of packagePathLists) {
  const file = JSON.parse(fs.readFileSync(packageJsonDir, 'utf8'));

  const devDependencies = file.devDependencies ?? {};
  const dependencies = file.dependencies ?? {};

  dependencyPerPackageTable.set(packageJsonDir, { ...devDependencies, ...dependencies });
}

const totalPackageVersionTable = new Map();

for (const dependencies of dependencyPerPackageTable.values()) {
  for (const [name, version] of Object.entries(dependencies)) {
    if (!totalPackageVersionTable.has(name)) {
      totalPackageVersionTable.set(name, new Map());
    }

    const versionVarietyMap = totalPackageVersionTable.get(name);
    versionVarietyMap.set(version, versionVarietyMap.get(version) + 1 || 1);
  }
}

for (const name of totalPackageVersionTable.keys()) {
  let howManyDuplicated = 0;

  const versionVarietyMap = totalPackageVersionTable.get(name);

  for (const frequency of versionVarietyMap.values()) {
    howManyDuplicated += frequency;
  }

  if (howManyDuplicated === 1) {
    totalPackageVersionTable.delete(name);
  }
}

const rootPackageTable = new Map(Object.entries({ ...packageJson.devDependencies, ...packageJson.dependencies }));

async function fixVersionMismatches() {
  for (const pkgName of totalPackageVersionTable.keys()) {
    const versionVarietyMap = totalPackageVersionTable.get(pkgName);

    if (rootPackageTable.has(pkgName)) {
      if (versionVarietyMap.size === 1 && versionVarietyMap.has('workspace:*')) continue;

      console.log(
        chalk.red(`The package `) +
          chalk.bold.underline.red(`${pkgName}`) +
          chalk.red(` is listed in the root. However, the child package mismatches with the root version.`)
      );

      const directoryLists = retrieveDir(pkgName);

      for (const dir of directoryLists) {
        updatePackageJson(dir, pkgName, 'workspace:*');
      }
    } else {
      if (versionVarietyMap.size === 1) {
        const keys = [...versionVarietyMap.keys()];
        for (const key of keys) {
          console.log(
            chalk.red(`The package `) +
              chalk.bold.underline.red(`${pkgName}`) +
              chalk.red(` is not listed in the root. However, it is listed in child packages with the same version:`) +
              chalk.bold.underline.greenBright(` ${key}`)
          );
        }

        const directoryLists = retrieveDir(pkgName);

        const rootPkg = JSON.parse(fs.readFileSync(path.join(monorepoRoot, 'package.json'), 'utf8'));

        const res = await inquirer.prompt([
          {
            type: 'list',
            name: 'selection',
            message: `You have duplicated dependency ${pkgName} in child packages, but it is not in the root of this repo.\n Select type of dependency to rewrite:`,
            choices: depTypeOptions,
          },
        ]);

        rootPkg[res.selection] = rootPkg[res.selection] || {};
        rootPkg[res.selection][pkgName] = keys[0];
        fs.writeFileSync(path.join(monorepoRoot, 'package.json'), JSON.stringify(rootPkg, null, 2), 'utf8');

        for (const dir of directoryLists) {
          updatePackageJson(dir, pkgName, 'workspace:*');
        }
      }
    }
  }
}

function retrieveDir(name) {
  const stack = [];
  for (const key of dependencyPerPackageTable.keys()) {
    const map = dependencyPerPackageTable.get(key);

    if (map[name]) {
      stack.push(key);
    }
  }

  return stack.filter(val => val !== path.join(monorepoRoot, 'package.json'));
}

function updatePackageJson(dir, pkgName, version) {
  const packagePath = path.resolve(dir);
  const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

  if (packageData.dependencies?.[pkgName]) {
    packageData.dependencies[pkgName] = version;
  } else if (packageData.devDependencies?.[pkgName]) {
    packageData.devDependencies[pkgName] = version;
  }

  fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2), 'utf8');
  console.log(chalk.blue(`Successfully updated ${pkgName} in ${path.basename(dir)}.`));
}

(async () => {
  try {
    await fixVersionMismatches();
    console.log(chalk.green('All mismatches have been fixed!'));
  } catch (err) {
    console.error(chalk.red('An error occurred:'), err);
  }
})();
