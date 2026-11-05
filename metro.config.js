const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withUniwindConfig(config, {
  // Ruta relativa al archivo de entrada de CSS (única configuración necesaria).
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
});
