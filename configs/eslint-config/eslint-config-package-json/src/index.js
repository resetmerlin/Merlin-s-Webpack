const path = require('path');

module.exports = {
  rules: {
    'pkg-rule': {
      meta: {
        hasSuggestions: true,
        type: 'problem',
        docs: {
          description: 'Ensure package.json contains valid "purpose", "output", and "exports" fields',
          recommended: true,
        },
        schema: [],
        messages: {
          invalidJson: 'The package.json file is not valid JSON.',
          missingPurpose: 'The "purpose" field is missing in package.json.',
          invalidPurpose:
            'The "purpose" field should match the expected values: library-cjs, library-esm, browser-app, etc.',
          missingOutput: 'The "output" field is missing in package.json.',
          missingExports: 'The "exports" field is missing in package.json.',
        },
      },
      // @ts-ignore
      create(context) {
        const isPackageJson = path.basename(context.getFilename()) === 'package.json';

        if (!isPackageJson) {
          return {};
        }

        let packageJsonContent;
        try {
          packageJsonContent = JSON.parse(context.getSourceCode().text);
        } catch {
          context.report({
            loc: { line: 1, column: 0 },
            messageId: 'invalidJson',
          });
          return {};
        }

        return {
          Program() {
            if (!('purpose' in packageJsonContent)) {
              context.report({
                loc: { line: 1, column: 0 },
                messageId: 'missingPurpose',
              });
            } else if (!['library-cjs', 'library-esm', 'browser-app'].includes(packageJsonContent.purpose)) {
              context.report({
                loc: { line: 1, column: 0 },
                messageId: 'invalidPurpose',
              });
            }

            if (!('output' in packageJsonContent)) {
              context.report({
                loc: { line: 1, column: 0 },
                messageId: 'missingOutput',
              });
            }

            if (!('exports' in packageJsonContent)) {
              context.report({
                loc: { line: 1, column: 0 },
                messageId: 'missingExports',
              });
            }
          },
        };
      },
    },
  },
};
