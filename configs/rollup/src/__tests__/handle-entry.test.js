/* eslint-disable @typescript-eslint/no-var-requires */

const { handleCJSEntrypoint, handleESMEntrypoint } = require('../handle-entry');
const pkg = require('./e2e-target/package.json');

describe('It should retrieve entry point', () => {
  const entrypoints = Object.keys(pkg.exports).filter(key => key !== './package.json');

  it('get cjs entry point', () => {
    entrypoints.forEach(entryPoint => {
      if (pkg.exports[entryPoint]) {
        expect(handleCJSEntrypoint(pkg.exports, entryPoint)).toBe(pkg.exports[entryPoint].require);
      }
    });
  });

  it('get esm entry point', () => {
    entrypoints.forEach(entryPoint => {
      if (pkg.exports[entryPoint]) {
        expect(handleESMEntrypoint(pkg.exports, entryPoint)).toBe(pkg.exports[entryPoint].import);
      }
    });
  });
});
