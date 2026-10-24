const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// El proyecto vive en un disco exFAT, donde macOS crea un archivo "._*" junto a cada archivo.
// Sin esto, expo-router intenta cargar "._index.tsx" etc. como pantallas.
config.resolver.blockList = [].concat(config.resolver.blockList ?? [], /(^|[\\/])\._[^\\/]*$/);

module.exports = config;
