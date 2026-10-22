const pino = require("pino");
const fs = require("fs");
const path = require("path");

const servicio = process.env.SERVICIO || "notificaciones";
// Apunta a la carpeta registros/ compartida en la raíz de practica10-observabilidad
const dirRegistros = path.resolve(__dirname, "../../registros");
if (!fs.existsSync(dirRegistros)) {
  fs.mkdirSync(dirRegistros, { recursive: true });
}

const archivoDestino = path.join(dirRegistros, `${servicio}.log`);

const destinos = pino.multistream([
  { stream: process.stdout },
  { stream: pino.destination({ dest: archivoDestino, sync: true }) },
]);

const registro = pino(
  {
    level: process.env.NIVEL_LOG || "info",
    base: { servicio, entorno: process.env.ENTORNO || "laboratorio" },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: { level: (etiqueta) => ({ nivel: etiqueta }) },
  },
  destinos
);

module.exports = { registro };
