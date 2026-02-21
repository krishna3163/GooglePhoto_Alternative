const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Forces Metro to resolve Axios to the browser version instead of the Node version.
// This prevents the "module crypto could not be found" error during the bundling process.
config.resolver.resolverMainFields = ['browser', 'main', 'module'];

module.exports = config;
