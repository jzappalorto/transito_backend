const express = require("express");
const db = require("../db/db");
const router = express.Router();

router.post("/", (req, res) => {
  const { email, password } = req.body;

  db.findOne({ email }, (err, user) => {
    if (err) return res.status(500).json({ success: false, message: "Error en la base de datos" });
    if (!user) return res.status(401).json({ success: false, message: "Usuario no encontrado" });
    if (user.password === password) {
      return res.json({ success: true, message: "Login exitoso", rama: user.rama, admin: user.admin });
    }
    return res.status(401).json({ success: false, message: "Contraseña incorrecta" });
  });
});

// Endpoint para agregar un nuevo usuario hardcodeado
router.post("/add", (req, res) => {
  const newUser = {
    _id: "1",
    email: "jzappalorto@gmail.com",
    password: "12345",
    rama: "Caminantes",
    admin: true
  };

  // Guardar el nuevo usuario en la base de datos
  db.insert(newUser, (err, newDoc) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Error al guardar el usuario" });
    }
    return res.status(201).json({ success: true, message: "Usuario agregado exitosamente", user: newDoc });
  });
});

// Endpoint para listar todos los usuarios
router.get("/list", (req, res) => {
  db.find({}, (err, users) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Error al obtener los usuarios" });
    }
    return res.json({ success: true, users: users });
  });
});

module.exports = router;
