require("dotenv").config();
const express = require("express");
const cors = require("cors");
const config = require("./config/config");
const loginRoutes = require("./routes/login");
const legajosRoutes = require("./routes/legajos");

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use("/login", loginRoutes);
app.use("/legajos", legajosRoutes);

// Iniciar servidor
const PORT = config.port || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
