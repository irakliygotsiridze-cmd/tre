const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('geojson');
config.resolver.sourceExts.push('geojson');
module.exports = config;
