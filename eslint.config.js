/* eslint-disable @typescript-eslint/no-var-requires */

const ts = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const js = require('@eslint/js');
const prettier = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');
const globals = require('globals');
const pkgRules = require('@enchant/eslint-plugin-package-json');

module.exports = [
  {
    ignores: ['node_modules', 'dist', 'coverage'],
  },
  {
    ...js.configs.recommended,
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        WebAssembly: true,
      },
    },
    plugins: {
      '@typescript-eslint': ts,
      '@enchant-package-json': pkgRules,
      prettier,
    },
    rules: {
      'no-unused-vars': 'off',
      'no-use-before-define': 'off',
      'prefer-const': [
        'error',
        {
          destructuring: 'all',
        },
      ],
      'object-shorthand': 'error',
      'no-var': 'error',

      // Prettier rules
      'prettier/prettier': 'error',

      // @typescript-eslint rules
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-var-requires': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'none',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      '@typescript-eslint/member-ordering': [
        'error',
        {
          default: [
            'public-static-field',
            'protected-static-field',
            'private-static-field',
            'public-instance-field',
            'protected-instance-field',
            'private-instance-field',
            'public-constructor',
            'protected-constructor',
            'private-constructor',
            'public-instance-method',
            'protected-instance-method',
            'private-instance-method',
          ],
        },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
        },
        {
          selector: 'interface',
          format: ['PascalCase'],
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
        },
      ],
    },
  },
  {
    ...prettierConfig,
    rules: {
      ...prettierConfig.rules,
    },
  },
  {
    files: ['**/*.json'],
    plugins: {
      '@enchant-package-json': pkgRules,
    },
    rules: {
      '@enchant-package-json/pkg-rule': 'error',
    },
  },
];
