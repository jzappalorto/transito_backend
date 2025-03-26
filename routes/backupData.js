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

/**
 * 📌 Endpoint: Backup (descarga un ZIP con todos los archivos de la carpeta de datos)
 */
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

/**
 * 📌 Endpoint: Restore (subir un ZIP y restaurar la carpeta de datos)
 */
router.post("/restore", upload.single("backup"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No se subió ningún archivo.");
  }

  try {
    console.log("Restaurando backup...");

    // Escribir el buffer del archivo ZIP en un stream para descomprimirlo
    const bufferStream = require("stream").Readable.from(req.file.buffer);

    // Extraer el ZIP en la carpeta de datos
    bufferStream
      .pipe(unzipper.Extract({ path: dataFolder }))
      .on("close", () => {
        console.log("Backup restaurado correctamente.");
        res.send("Backup restaurado correctamente.");
      })
      .on("error", (err) => {
        console.error("Error al restaurar el backup:", err);
        res.status(500).send("Error al restaurar el backup.");
      });

  } catch (err) {
    console.error("Error en el proceso de restauración:", err);
    res.status(500).send("Error en el proceso de restauración.");
  }
});

module.exports = router;
