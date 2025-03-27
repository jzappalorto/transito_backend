require("dotenv").config();
const express = require("express");
const cors = require("cors");
const config = require("./config/config");
const loginRoutes = require("./routes/login");
const legajosRoutes = require("./routes/legajos");
const backupDataRoutes = require("./routes/backupData");
const restoreRoutes = require("./routes/restore");

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use("/login", loginRoutes);
app.use("/legajos", legajosRoutes);
app.use("/backupData", backupDataRoutes);
app.use("/restore", restoreRoutes);

// Iniciar servidor
const PORT = config.port || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
