// Metro de la app: además de la app, vigila el código compartido con Ker Hub web.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// También los íconos 3D de Ker Hub (public/iconos): un solo juego para web y app.
config.watchFolders = [path.resolve(__dirname, '../../packages'), path.resolve(__dirname, '../../public/iconos')];

module.exports = config;
