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

// Función para eliminar archivos en una carpeta
const deleteFilesInDirectory = (directoryPath) => {
  try {
    const files = fs.readdirSync(directoryPath);
    files.forEach((file) => {
      const filePath = path.join(directoryPath, file);
      if (fs.lstatSync(filePath).isFile()) {
        fs.unlinkSync(filePath); // Eliminar archivo
      }
    });
  } catch (err) {
    console.error("Error al eliminar archivos:", err);
  }
};

router.post("/restore", upload.single("backup"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No se subió ningún archivo.");
  }

  try {
    console.log("Restaurando backup...");

    // Eliminar archivos existentes en la carpeta de datos
    deleteFilesInDirectory(dataFolder);
    
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