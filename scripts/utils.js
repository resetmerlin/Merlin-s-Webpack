const path = require('path');
const fs = require('fs');

/**
 * Reads and parses a JSON file from a given directory.
 * @param {string} dir - The path to the JSON file.
 * @returns {object} The parsed JSON content.
 * @throws {Error} If the file doesn't exist, is not readable, or is not valid JSON.
 */
function readAndParseFile(dir) {
  try {
    const resolvedPath = path.resolve(dir);

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File does not exist: ${resolvedPath}`);
    }

    const fileContent = fs.readFileSync(resolvedPath, 'utf8');
    return JSON.parse(fileContent);
  } catch (err) {
    throw new Error(`Failed to read or parse the file at ${dir}: ${err.message}`);
  }
}

/**
 * Writes an object to a JSON file in a given directory.
 * @param {string} dir - The path to write the JSON file.
 * @param {object} file - The object to write into the file.
 * @throws {Error} If the file cannot be written.
 */
function writeOnFile(dir, file) {
  try {
    const resolvedPath = path.resolve(dir);
    fs.writeFileSync(resolvedPath, JSON.stringify(file, null, 2), 'utf8');
  } catch (err) {
    throw new Error(`Failed to write to the file at ${dir}: ${err.message}`);
  }
}

module.exports = {
  readAndParseFile,
  writeOnFile,
};
