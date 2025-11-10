/** @type {import('metro-config').Config} */
const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// If you previously customized resolver/transformer, re-add later.
// This default gets you back to a working state.
module.exports = config;
