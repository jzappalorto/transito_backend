const express = require("express");
const multer = require("multer");
const unzipper = require("unzipper");
const path = require("path");
const fs = require("fs");
const config = require("../config");

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

// Nombres literales de los archivos de legajos
const legajoFiles = [
  "legajosCaminantes.db",
  "legajosCastores.db",
  "legajosManada.db",
  "legajosUnidad.db",
  "legajosRovers.db"
];

router.post("/restore", upload.single("backup"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No se subió ningún archivo.");
  }

  try {
    console.log("Restaurando backup...");

    // Eliminar archivos existentes en la carpeta de datos
    deleteFilesInDirectory(dataFolder);

    // Crear un flujo de lectura para el archivo ZIP subido
    const bufferStream = require("stream").Readable.from(req.file.buffer);

    // Usar unzipper para procesar el archivo ZIP
    bufferStream
      .pipe(unzipper.Parse())
      .on("entry", (entry) => {
        const fileName = entry.path;
        const fileType = entry.type; // 'File' o 'Directory'

        // Eliminar la carpeta "backup" si es el primer nivel en el archivo
        if (fileName.startsWith("backup/")) {
          const cleanFileName = fileName.replace("backup/", ""); // Eliminar "backup/" del nombre

          if (fileType === 'File') {
            // Si el archivo es uno de los archivos de legajos esperados, lo restauramos con el nombre literal
            if (legajoFiles.includes(cleanFileName)) {
              const filePath = path.join(dataFolder, cleanFileName);
              entry.pipe(fs.createWriteStream(filePath));
              console.log(`Restaurando archivo: ${cleanFileName}`);
            } else {
              console.log(`Archivo no esperado: ${cleanFileName}, se ignora.`);
              entry.autodrain(); // Drenamos el archivo si no es uno de los legajos
            }
          } else {
            // Si es un directorio, lo ignoramos o lo puedes crear si es necesario
            console.log(`Ignorando directorio: ${fileName}`);
            entry.autodrain(); // Solo drenar el contenido si es un directorio
          }
        } else {
          console.log(`Ignorando archivo o directorio fuera de la carpeta 'backup': ${fileName}`);
          entry.autodrain(); // Drenar el contenido si no está dentro de la carpeta 'backup'
        }
      })
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
