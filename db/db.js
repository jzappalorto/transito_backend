const NeDB = require("nedb");
const path = require("path");

// Verifica si estamos en producción (Railway)
//const isProduction = process.env.NODE_ENV === 'production';
const isProduction = false;

// Si estamos en producción, usamos el volumen persistente (/mnt/data)
const dbPath = isProduction
  ? path.join('/mnt/data', 'usuarios.db')  // Ruta en producción
  : path.join(__dirname, "../basededatos", 'usuarios.db');  // Ruta local en desarrollo

// Base de datos de usuarios (solo para login)
const usersDB = new NeDB({
  filename: dbPath,
  autoload: true,
});

module.exports = usersDB;
