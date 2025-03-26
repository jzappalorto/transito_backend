const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "../config.json");
let config;

try {
  const configData = fs.readFileSync(configPath, "utf8");
  config = JSON.parse(configData);
} catch (error) {
  console.error("Error al leer config.json:", error);
  process.exit(1);
}

module.exports = config;
