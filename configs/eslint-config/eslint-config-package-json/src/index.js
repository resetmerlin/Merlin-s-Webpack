const path = require('path');
const pkg = require('../package.json');

module.exports = {
  meta: {
    name: pkg.name,
    hasSuggestions: true,
    type: 'problem',
    docs: {
      description: 'Ensure package.json contains valid "purpose", "output", and "exports" fields',
    },
    schema: [],
  },
  rules: {
    'pkg-rule': {
      // @ts-ignore
      create(context) {
        const isPackageJson =
          path.basename(context.getFilename()) === 'package.json' &&
          context.getFilename().includes(`${path.sep}lib${path.sep}`);

        if (!isPackageJson) {
          return {};
        }

        let packageJsonContent;
        try {
          packageJsonContent = JSON.parse(context.getSourceCode().text);
        } catch {
          context.report({
            loc: { line: 1, column: 0 },
            message: 'The package.json file is not valid JSON',
          });
          return {};
        }

        return {
          Program() {
            if (!('purpose' in packageJsonContent)) {
              context.report({
                loc: { line: 1, column: 0 },
                message: 'The "purpose" field is missing in package.json',
              });
            } else if (!['node-cjs', 'node-esm', 'browser-esm'].includes(packageJsonContent.purpose)) {
              context.report({
                loc: { line: 1, column: 0 },
                message: 'The "purpose" field should match the expected values: node-cjs, node-esm, browser-esm, etc',
              });
            }

            if (!('output' in packageJsonContent)) {
              context.report({
                loc: { line: 1, column: 0 },
                message: 'The "output" field is missing in package.json',
              });
            } else {
              const output = packageJsonContent.output;

              for (const [key, value] of Object.entries(output)) {
                if (typeof value !== 'object' || !('require' in value) || !('import' in value) || !('types' in value)) {
                  context.report({
                    loc: { line: 1, column: 0 },
                    message: `Invalid "output" entry for key "${key}". Each entry must contain "require", "import", and "types".`,
                  });
                } else {
                  if (typeof value.require !== 'string') {
                    context.report({
                      loc: { line: 1, column: 0 },
                      message: `Invalid "require" value for "output.${key}". It must be a string.`,
                    });
                  }
                  if (typeof value.import !== 'string') {
                    context.report({
                      loc: { line: 1, column: 0 },
                      message: `Invalid "import" value for "output.${key}". It must be a string.`,
                    });
                  }
                  if (typeof value.types !== 'string') {
                    context.report({
                      loc: { line: 1, column: 0 },
                      message: `Invalid "types" value for "output.${key}". It must be a string.`,
                    });
                  }
                }
              }
            }

            if (!('exports' in packageJsonContent)) {
              context.report({
                loc: { line: 1, column: 0 },
                message: 'The "exports" field is missing in package.json',
              });
            }

            if (!('tsconfig' in packageJsonContent)) {
              context.report({
                loc: { line: 1, column: 0 },
                message: 'The "tsconfig" field is missing in package.json',
              });
            } else if (typeof packageJsonContent.tsconfig !== 'string') {
              context.report({
                loc: { line: 1, column: 0 },
                message: 'The "tsconfig" field should be string that indicates directory',
              });
            }
          },
        };
      },
    },
  },
};
