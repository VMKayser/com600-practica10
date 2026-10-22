const cliente = require("prom-client");

cliente.collectDefaultMetrics();

const duracion = new cliente.Histogram({
  name: "http_request_duration_seconds",
  help: "Duración de las peticiones HTTP en segundos",
  labelNames: ["metodo", "ruta", "codigo"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

module.exports = { cliente, duracion };
