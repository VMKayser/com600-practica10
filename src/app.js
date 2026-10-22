const express = require("express");
const { correlacion } = require("./correlacion");
const { cliente, duracion } = require("./metricas");
const { avisar } = require("./clienteNotificaciones");
const { conSpan } = require("./trazas");

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

const tareas = [
  { id: 1, titulo: "Configurar Prometheus", completada: true },
  { id: 2, titulo: "Diseñar tablero Grafana", completada: false },
];

// Endpoint de métricas de Prometheus
app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", cliente.register.contentType);
  res.end(await cliente.register.metrics());
});

// Endpoint de salud
app.get("/salud", (_req, res) => {
  res.json({ estado: "arriba", servicio: "tareas-api" });
});

// Endpoint para simular error 500 (usado en Lab 4 y Lab 7)
app.get("/error", (req, res) => {
  if (req.registro) {
    req.registro.error({ causa: "Simulación de fallo para alertas SLO" }, "Error interno provocado");
  }
  res.status(500).json({ error: "Fallo provocado deliberadamente para prueba de alertas" });
});

// Endpoint de lentitud para comparar Promedio vs Percentil 95/99 (Lab 4)
app.get("/tareas/lenta", async (req, res) => {
  const espera = 1500;
  await new Promise((r) => setTimeout(r, espera));
  if (req.registro) {
    req.registro.warn({ ms: espera }, "Petición lenta ejecutada");
  }
  res.json({ mensaje: "Respuesta demorada 1500ms", ms: espera });
});

// Obtener todas las tareas
app.get("/tareas", (req, res) => {
  if (req.registro) {
    req.registro.info({ totalTareas: tareas.length }, "Listando tareas");
  }
  res.json(tareas);
});

// Crear una nueva tarea
app.post("/tareas", async (req, res) => {
  const { titulo } = req.body;
  if (!titulo) {
    if (req.registro) {
      req.registro.error({ campo: "titulo" }, "Falta el título obligatorio");
    }
    return res.status(400).json({ error: "titulo es obligatorio" });
  }

  // Span de negocio personalizado (Lab 5)
  await conSpan("validar_tarea", { "tarea.titulo_largo": titulo.length }, async () => {
    // Simula una breve validación de negocio
    return true;
  });

  const nuevaTarea = {
    id: tareas.length + 1,
    titulo,
    completada: false,
    creadoEn: new Date().toISOString(),
  };
  tareas.push(nuevaTarea);

  if (req.registro) {
    req.registro.info({ id: nuevaTarea.id, titulo }, "Tarea creada exitosamente");
  }

  // Propagación hacia el servicio de notificaciones (Lab 2)
  try {
    await avisar(req, nuevaTarea);
  } catch (err) {
    if (req.registro) {
      req.registro.error({ err: err.message }, "Error al propagar aviso");
    }
  }

  res.status(201).json(nuevaTarea);
});

module.exports = app;
