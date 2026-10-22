const express = require("express");
const { correlacion } = require("./correlacion");
const { cliente, duracion } = require("./metricas");

const app = express();
app.use(express.json());

// 1. Middleware de correlación (x-correlation-id, traceId, spanId)
app.use(correlacion);

// 2. Middleware de métricas de duración de peticiones HTTP
app.use((req, res, next) => {
  const fin = duracion.startTimer();
  res.on("finish", () => {
    fin({
      metodo: req.method,
      ruta: req.route ? req.route.path : req.path || "sin_ruta",
      codigo: res.statusCode,
    });
  });
  next();
});

// Endpoint de métricas de Prometheus
app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", cliente.register.contentType);
  res.end(await cliente.register.metrics());
});

// Endpoint de salud
app.get("/salud", (_req, res) => {
  res.json({ estado: "arriba", servicio: "notificaciones" });
});

// Endpoint para recepción de avisos de tareas creadas
app.post("/avisos", async (req, res) => {
  const { tarea } = req.body;

  // Lentitud artificial del Laboratorio 5: se activa con DEMORA_ARTIFICIAL=true o 1400ms
  if (process.env.DEMORA_ARTIFICIAL === "true") {
    await new Promise((r) => setTimeout(r, 1400));
  }

  if (req.registro) {
    req.registro.info(
      { tareaId: tarea ? tarea.id : null, titulo: tarea ? tarea.titulo : null },
      "Aviso de tarea recibido en servicio de notificaciones"
    );
  }

  res.status(200).json({
    recibido: true,
    servicio: "notificaciones",
    tareaId: tarea ? tarea.id : null,
  });
});

module.exports = app;
