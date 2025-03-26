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

module.exports = router;
