/** @type {import('metro-config').ConfigT} */
const path = require('path');
const { getDefaultConfig } = require('@expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(__dirname, '../..');

const config = getDefaultConfig(projectRoot);

// Force React to resolve from workspace root (avoid stray React 19 copies)
config.resolver ??= {};
config.resolver.extraNodeModules = {
  react: path.join(workspaceRoot, 'node_modules/react'),
  'react-dom': path.join(workspaceRoot, 'node_modules/react-dom'),
};

// Watch monorepo folders so Metro can see packages
config.watchFolders = Array.from(new Set([
  ...(config.watchFolders || []),
  workspaceRoot,
  path.join(workspaceRoot, 'packages/ui'),
  path.join(workspaceRoot, 'packages/types'),
  path.join(workspaceRoot, 'packages/config'),
  path.join(workspaceRoot, 'packages/auth'),
  path.join(workspaceRoot, 'packages/api-client'),
  path.join(workspaceRoot, 'apps/sideui'),
]));

module.exports = config;
