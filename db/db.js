const NeDB = require("nedb");
const path = require("path");

// Base de datos de usuarios (solo para login)
const usersDB = new NeDB({
  filename: path.join(__dirname, "../basededatos/usuarios.db"),
  autoload: true,
});

module.exports = usersDB;
