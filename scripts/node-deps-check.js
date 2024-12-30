/* eslint-disable @typescript-eslint/no-var-requires */
const glob = require('glob');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { ROOT, INQUIRER_PROMPT } = require('./constants');
const { readAndParseFile, writeOnFile } = require('./utils');

/**
 * Get all `package.json` file paths from the specified workspaces.
 * @returns {string[]} Array of paths to `package.json` files.
 */
function getAllPackageJsonDir() {
  const workspaces = ROOT.PACKAGE_JSON_CONTENT.workspaces;

  if (workspaces == null) {
    console.log(chalk.red('You need to specify your workspaces'));
    return [];
  }

  return workspaces.flatMap(workspace => {
    return glob.sync(`${workspace}/package.json`, {
      cwd: ROOT.PATH,
      ignore: ['**/node_modules/**', '**/.git/**', '**/.yarn/**'],
      absolute: true,
    });
  });
}

/**
 * Generate a dependency graph for each `package.json` file.
 * @param {string[]} pkgPathLists - Array of paths to `package.json` files.
 * @returns {Map<string, object>} A map of `package.json` paths to their dependencies.
 */
function getDepsGraphPerPackage(pkgPathLists) {
  const depsPerPkg = new Map();

  for (const pkgJsonPath of pkgPathLists) {
    const file = readAndParseFile(pkgJsonPath);

    const devDependencies = file?.devDependencies ?? {};
    const dependencies = file?.dependencies ?? {};

    depsPerPkg.set(pkgJsonPath, { ...devDependencies, ...dependencies });
  }

  return depsPerPkg;
}

/**
 * Generate a map of all dependencies with their respective versions and occurrences.
 * @param {Map<string, object>} depsPerPkg - Dependency graph for each `package.json` file.
 * @returns {Map<string, Map<string, number>>} A map of dependency names to a map of versions and their occurrences.
 */
function getEntireDepsWithVersions(depsPerPkg) {
  const entirePkgVersions = new Map();

  for (const dependencies of depsPerPkg.values()) {
    for (const [name, version] of Object.entries(dependencies)) {
      if (!entirePkgVersions.has(name)) {
        entirePkgVersions.set(name, new Map());
      }

      const versionVariety = entirePkgVersions.get(name);
      versionVariety.set(version, versionVariety.get(version) + 1 || 1);
    }
  }

  for (const name of entirePkgVersions.keys()) {
    let totalOccurrences = 0;

    const versions = entirePkgVersions.get(name);

    for (const frequency of versions.values()) {
      totalOccurrences += frequency;
    }

    if (totalOccurrences === 1) {
      entirePkgVersions.delete(name);
    }
  }

  return entirePkgVersions;
}

/**
 * Rewrite `package.json` files to resolve version mismatches.
 * @param {object} params - Parameters for rewriting files.
 * @param {string} [params.version] - Selected version to use.
 * @param {string} [params.depsType] - Dependency type (`dependencies` or `devDependencies`).
 * @param {Map<string, object>} params.depsGraphPerPkg - Dependency graph for each `package.json` file.
 * @param {string} params.pkgName - Name of the package to rewrite.
 */
function rewritePkgJsonFile({ version, depsType, depsGraphPerPkg, pkgName }) {
  if (version == null && depsType == null) {
    rewriteChildPkgJsonFile(depsGraphPerPkg, pkgName);
    return;
  }

  rewriteRootPkgJsonFile(depsType, version);
  rewriteChildPkgJsonFile(depsGraphPerPkg, pkgName);
}

/**
 * Rewrite the root `package.json` file with the specified dependency and version.
 * @param {string} depsType - Dependency type (`dependencies` or `devDependencies`).
 * @param {string} version - Selected version to use.
 */
function rewriteRootPkgJsonFile(depsType, version) {
  const file = { ...ROOT.PACKAGE_JSON_CONTENT };
  file[depsType][pkgName] = version;
  writeOnFile(ROOT.PACKAGE_JSON, file);
}

/**
 * Rewrite child `package.json` files to use workspace references (`workspace:*`) for a given package.
 * @param {Map<string, object>} depsGraphPerPkg - Dependency graph for each `package.json` file.
 * @param {string} pkgName - Name of the package to rewrite.
 */
function rewriteChildPkgJsonFile(depsGraphPerPkg, pkgName) {
  const dirLists = [];

  for (const dir of depsGraphPerPkg.keys()) {
    if (dir === ROOT.PACKAGE_JSON) continue;
    const deps = depsGraphPerPkg.get(dir);

    if (deps[pkgName]) {
      dirLists.push(dir);
    }
  }

  for (const dir of dirLists) {
    const file = readAndParseFile(dir);

    if (file.dependencies?.[pkgName]) {
      file.dependencies[pkgName] = 'workspace:*';
    } else if (file.devDependencies?.[pkgName]) {
      file.devDependencies[pkgName] = 'workspace:*';
    }

    writeOnFile(dir, file);
  }
}

/**
 * Fix version mismatches across the monorepo by rewriting `package.json` files.
 * @param {Map<string, object>} depsGraphPerPkg - Dependency graph for each `package.json` file.
 */
async function fixVersionMismatches(depsGraphPerPkg) {
  const entirePkgVersions = getEntireDepsWithVersions(depsGraphPerPkg);

  const rootPkgDeps = new Map(
    Object.entries({
      ...(ROOT.PACKAGE_JSON_CONTENT?.devDependencies ?? {}),
      ...(ROOT.PACKAGE_JSON_CONTENT?.dependencies ?? {}),
    })
  );

  for (const pkgName of entirePkgVersions.keys()) {
    const pkgVersions = entirePkgVersions.get(pkgName);

    if (rootPkgDeps.has(pkgName)) {
      if (pkgVersions.size === 1 && pkgVersions.has('workspace:*')) continue;

      console.log(
        chalk.red(`The package `) +
          chalk.bold.underline.red(`${pkgName}`) +
          chalk.red(` is listed in the root, but the version used in child packages does not match the root version.`)
      );

      rewritePkgJsonFile({ depsGraphPerPkg, pkgName });
    } else {
      if (pkgVersions.size === 1) {
        const version = [...pkgVersions.keys()].shift();

        console.log(
          chalk.red(`The package `) +
            chalk.bold.underline.red(`${pkgName}`) +
            chalk.red(` is not listed in the root, but it is used in child packages with the following version:`) +
            chalk.bold.underline.greenBright(` ${version}`)
        );

        const depsType = await inquirer.prompt([
          {
            ...INQUIRER_PROMPT.DEFAULT_CONFIG,
            message: `The dependency ${pkgName} is used in child packages but is not listed in the root package.json.\nChoose the type of dependency to add it as:`,
          },
        ]);

        rewritePkgJsonFile({ version, depsType: depsType.selection, depsGraphPerPkg, pkgName });
      } else {
        const versions = [...pkgVersions.keys()];

        console.log(
          chalk.red(`The package `) +
            chalk.bold.underline.red(`${pkgName}`) +
            chalk.red(` is not listed in the root, but it is used in child packages with multiple versions:`) +
            chalk.bold.underline.greenBright(` ${versions.join(', ')}`)
        );

        const version = await inquirer.prompt([
          {
            ...INQUIRER_PROMPT.DEFAULT_CONFIG,
            message: `The dependency ${pkgName} is used in child packages with multiple versions. Select the appropriate version to use:`,
            choices: versions.map(val => {
              return {
                name: val,
                value: val,
              };
            }),
          },
        ]);

        const depsType = await inquirer.prompt([
          {
            ...INQUIRER_PROMPT.DEFAULT_CONFIG,
            message: `You selected version ${version.selection} for ${pkgName}, but it is not listed in the root package.json.\nChoose the type of dependency to add it as:`,
          },
        ]);

        rewritePkgJsonFile({ version: version.selection, depsType: depsType.selection, depsGraphPerPkg, pkgName });
      }
    }
  }
}

const pkgJsonDirLists = getAllPackageJsonDir();
const depsGraphPerPkg = getDepsGraphPerPackage(pkgJsonDirLists);

(async () => {
  try {
    await fixVersionMismatches(depsGraphPerPkg);
    console.log(chalk.green('All mismatches have been resolved!'));
  } catch (err) {
    console.error(chalk.red('An error occurred:'), err);
  }
})();
