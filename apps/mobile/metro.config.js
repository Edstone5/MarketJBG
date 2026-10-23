const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// Desde el SDK 52 Expo configura solo los monorepos (carpetas vigiladas y
// enlaces simbólicos de los workspaces de pnpm). No desactives
// `resolver.disableHierarchicalLookup` ni fijes `nodeModulesPaths`: con el
// node_modules aislado de pnpm, Metro dejaría de encontrar las dependencias
// de las dependencias (p. ej. whatwg-fetch) y la app no empaqueta.
const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
