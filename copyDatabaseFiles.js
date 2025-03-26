const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../basededatos'); // Carpeta de origen (basededatos)
const targetDir = '/mnt/data'; // Ruta del volumen persistente en Railway

// Función para copiar archivos de una carpeta a otra
const copyFiles = (src, dest) => {
  // Verificar si la carpeta de destino existe, si no, crearla
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Leer los archivos de la carpeta de origen
  fs.readdir(src, (err, files) => {
    if (err) {
      console.error('Error al leer los archivos:', err);
      return;
    }

    // Iterar sobre los archivos y copiarlos
    files.forEach((file) => {
      const srcFile = path.join(src, file);
      const destFile = path.join(dest, file);

      // Copiar archivo
      fs.copyFile(srcFile, destFile, (err) => {
        if (err) {
          console.error('Error al copiar el archivo:', err);
        } else {
          console.log(`Archivo copiado: ${file}`);
        }
      });
    });
  });
};

// Llamar a la función para copiar todos los archivos
copyFiles(sourceDir, targetDir);
