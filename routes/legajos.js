const express = require("express");
const NeDB = require("nedb");
const path = require("path");
const router = express.Router();

// Función para cargar la base de datos dinámica según la rama
const getDatabaseForRama = (rama) => {
  const validRamas = ["Castores", "Manada", "Unidad", "Caminantes", "Rovers"];
  if (!validRamas.includes(rama)) {
    throw new Error("Rama no válida");
  }

  // Verifica si estamos en producción (Railway)
  const isProduction = process.env.NODE_ENV === 'production';

  // En producción, usar el volumen persistente (/mnt/data), en desarrollo la ruta local
  const dbPath = isProduction
    ? path.join('/mnt/data', `legajos${rama}.db`)  // Ruta en producción
    : path.join(__dirname, `../basededatos/legajos${rama}.db`);  // Ruta local en desarrollo

  return new NeDB({
    filename: dbPath,
    autoload: true,
  });
};


// Definir el orden de paso entre ramas
const nextRama = {
  Castores: "Manada",
  Manada: "Unidad",
  Unidad: "Caminantes",
  Caminantes: "Rovers",
};

// Endpoint para mover un legajo a la siguiente rama
router.put("/mover/:rama/:id", (req, res) => {
  const { rama, id } = req.params;

  if (!nextRama[rama]) {
    return res.status(400).json({ success: false, message: "No se puede mover desde esta rama" });
  }

  const dbActual = getDatabaseForRama(rama);
  const dbSiguiente = getDatabaseForRama(nextRama[rama]);

  dbActual.findOne({ _id: id }, (err, legajo) => {
    if (err || !legajo) {
      return res.status(404).json({ success: false, message: "Legajo no encontrado" });
    }

    // Eliminar el campo _id antes de insertarlo en la nueva base de datos
    const { _id, ...nuevoLegajo } = legajo;

    // Obtener el último ID en la base de datos de destino para asignar un nuevo ID numérico como string
    dbSiguiente.find({}).sort({ _id: -1 }).limit(1).exec((err, docs) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Error al obtener el último ID" });
      }

      const lastId = docs.length > 0 ? parseInt(docs[0]._id, 10) : 0;
      nuevoLegajo._id = (lastId + 1).toString(); // Asignar un nuevo ID como string

      // Insertar el legajo en la nueva base de datos
      dbSiguiente.insert(nuevoLegajo, (err, nuevoRegistro) => {
        if (err) {
          return res.status(500).json({ success: false, message: "Error al mover el legajo" });
        }

        // Eliminar el legajo de la base de datos actual
        dbActual.remove({ _id: id }, {}, (err) => {
          if (err) {
            return res.status(500).json({ success: false, message: "Error al eliminar el legajo de la base actual" });
          }
          res.json({ success: true, message: "Legajo movido correctamente", data: nuevoRegistro });
        });
      });
    });
  });
});

// Endpoint para obtener legajos según la rama
router.get("/:rama", (req, res) => {
  const { rama } = req.params;

  try {
    const db = getDatabaseForRama(rama); // Cargar base de datos para la rama
    db.find({}, (err, legajosData) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Error al acceder a la base de datos" });
      }

      // Si no hay legajos, devolver un array vacío
      if (!legajosData || legajosData.length === 0) {
        return res.json({ success: true, legajos: [] });
      }

      // Función para calcular la edad a partir de la fecha de nacimiento
      const calcularEdad = (fechaNacimiento) => {
        const hoy = new Date();
        const nacimiento = new Date(fechaNacimiento);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const mes = hoy.getMonth() - nacimiento.getMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
          edad--;
        }
        return edad;
      };

      // Agregar el campo "edad" a cada legajo sin modificar la base de datos
      const legajos = legajosData.map(legajo => ({
        ...legajo,
        edad: calcularEdad(legajo.fechaNacimiento)
      }));

      res.json({ success: true, legajos });
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/:rama", async (req, res) => {
  const { rama } = req.params;
  const { nombre, documento, fechaNacimiento } = req.body;

  if (!nombre || !documento || !fechaNacimiento) {
    return res.status(400).json({ success: false, message: "Todos los campos son obligatorios" });
  }

  try {
    const db = getDatabaseForRama(rama);

    // Verificar si ya existe un legajo con el mismo documento o nombre
    db.findOne({ $or: [{ documento }, { nombre }] }, (err, legajoExistente) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Error al verificar duplicados" });
      }
      if (legajoExistente) {
        return res.status(400).json({ success: false, message: "El documento o el nombre ya existen en la base de datos" });
      }

      // Obtener el último _id y calcular el nuevo
      db.find({})
        .sort({ _id: -1 })
        .limit(1)
        .exec((err, docs) => {
          if (err) {
            return res.status(500).json({ success: false, message: "Error al obtener el último ID" });
          }

          const lastId = docs.length > 0 ? parseInt(docs[0]._id, 10) : 0;
          const newId = (lastId + 1).toString(); // Convertimos a string para mantener consistencia

          const nuevoLegajo = {
            _id: newId,
            nombre,
            documento,
            fechaNacimiento,
          };

          // Insertar el nuevo legajo
          db.insert(nuevoLegajo, (err, nuevoRegistro) => {
            if (err) {
              return res.status(500).json({ success: false, message: "Error al guardar el legajo" });
            }
            res.json({ success: true, message: "Legajo creado", data: nuevoRegistro });
          });
        });
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

router.put("/editar/:rama/:id", (req, res) => {
  const { rama, id } = req.params;
  const { nombre, documento, fechaNacimiento } = req.body;

  if (!nombre || !documento || !fechaNacimiento) {
    return res.status(400).json({ success: false, message: "Todos los campos son obligatorios" });
  }

  try {
    const db = getDatabaseForRama(rama); // Cargar base de datos para la rama

    // Verificar si ya existe otro legajo con el mismo documento o nombre, excepto el que estamos editando
    db.findOne({ 
      $or: [{ documento }, { nombre }],
      _id: { $ne: id } // Excluir el legajo que estamos editando
    }, (err, legajoExistente) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Error al verificar duplicados" });
      }
      if (legajoExistente) {
        return res.status(400).json({ success: false, message: "El documento o el nombre ya existen en la base de datos" });
      }

      // Si no existe duplicado, proceder con la actualización del legajo
      db.update({ _id: id }, { $set: { nombre, documento, fechaNacimiento } }, {}, (err, numReplaced) => {
        if (err) {
          return res.status(500).json({ success: false, message: "Error al actualizar el legajo" });
        }
        if (numReplaced === 0) {
          return res.status(404).json({ success: false, message: "Legajo no encontrado" });
        }
        res.json({ success: true, message: "Legajo actualizado" });
      });
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

// Endpoint para eliminar un legajo
router.delete("/eliminar/:rama/:id", (req, res) => {
  const { rama, id } = req.params;

  try {
    const db = getDatabaseForRama(rama); // Obtener la base de datos correspondiente

    db.remove({ _id: id }, {}, (err, numRemoved) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Error al eliminar el legajo" });
      }
      if (numRemoved === 0) {
        return res.status(404).json({ success: false, message: "Legajo no encontrado" });
      }
      res.json({ success: true, message: "Legajo eliminado correctamente" });
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});


module.exports = router;
