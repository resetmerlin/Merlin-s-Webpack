const path = require('path');
const { readAndParseFile } = require('./utils');

const ROOT = {
  PATH: path.resolve(process.cwd()),
  PACKAGE_JSON: path.join(process.cwd(), 'package.json'),
  PACKAGE_JSON_CONTENT: readAndParseFile(path.join(process.cwd(), 'package.json')),
};

const INQUIRER_PROMPT = {
  DEFAULT_CONFIG: {
    type: 'list',
    name: 'selection',
    message: ``,
    choices: [
      { name: 'dependency', value: 'dependencies' },
      { name: 'devDependency', value: 'devDependencies' },
    ],
  },
};

module.exports = { ROOT, INQUIRER_PROMPT };
