const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

module.exports = {
  projectRoot,
  watchFolders: [workspaceRoot],
  resolver: {
    // Look in both the app and the monorepo root for packages
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
  },
};
