module.exports = {
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest', // Use babel-jest for JavaScript and TypeScript
  },
  testEnvironment: 'node', // Set the environment to Node.js
  moduleNameMapper: {
    '^.+\\.(css|less|scss|png|jpg|jpeg|svg|gif|woff|woff2)$': 'identity-obj-proxy', // Mock static assets
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'], // Treat TypeScript as ESM if necessary,

  testPathIgnorePatterns: ['/node_modules/', '/dist/'], // Exclude node_modules and dist folders
};
