const NeDB = require("nedb");
const path = require("path");
const config = require("../config/config")

// Si estamos en producción, usamos el volumen persistente (/mnt/data)
const dbPath = path.join(config.dataFolder, "usuarios.db"); // Asigna correctamente el archivo

path.join(config.dataFolder, 'usuarios.db');

// Base de datos de usuarios (solo para login)
const usersDB = new NeDB({
  filename: dbPath,
  autoload: true,
});

module.exports = usersDB;
