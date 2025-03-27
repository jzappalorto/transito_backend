const express = require("express");
const archiver = require("archiver");
const multer = require("multer");
const unzipper = require("unzipper");
const path = require("path");
const fs = require("fs");
const config = require("../config"); // Importamos la configuración

const router = express.Router();
const dataFolder = path.resolve(config.dataFolder); // Ruta desde config.json

// 🗂 Configurar Multer para manejar la subida de archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/backup", (req, res) => {
  res.setHeader("Content-Disposition", 'attachment; filename="backup.zip"');
  res.setHeader("Content-Type", "application/zip");

  const archive = archiver("zip", { zlib: { level: 9 } });

  archive.on("error", (err) => {
    console.error("Error al generar el ZIP:", err);
    res.status(500).send("Error al generar el backup");
  });

  archive.pipe(res); // Enviar el ZIP directamente al cliente
  archive.directory(dataFolder, false); // Agregar todos los archivos de la carpeta al ZIP
  archive.finalize(); // Finalizar la creación del ZIP
});

module.exports = router;
