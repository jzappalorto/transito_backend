const express = require("express");
const archiver = require("archiver");
const path = require("path");
const config = require("../config"); // Importamos la configuración
const fs = require("fs");

const router = express.Router();
const dataFolder = path.resolve(config.dataFolder); // Ruta desde config.json

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
