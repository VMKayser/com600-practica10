async function avisar(req, tarea) {
  const inicio = Date.now();
  try {
    const headers = {
      "Content-Type": "application/json",
    };
    // Soporte para romper la propagación a propósito (Laboratorio 2, Paso 6)
    const romper = process.env.PROPAGAR_CORRELACION === "false" || req.headers["x-romper-correlacion"] === "true";
    if (!romper && req.idCorrelacion) {
      headers["x-correlation-id"] = req.idCorrelacion;
    }
    const r = await fetch("http://localhost:3001/avisos", {
      method: "POST",
      headers,
      body: JSON.stringify({ tarea }),
    });
    if (req.registro) {
      req.registro.info(
        { ms: Date.now() - inicio, estado: r.status },
        "aviso enviado a notificaciones"
      );
    }
    return r.status;
  } catch (err) {
    if (req.registro) {
      req.registro.error(
        { ms: Date.now() - inicio, err: err.message },
        "fallo al enviar aviso a notificaciones"
      );
    }
    return 500;
  }
}

module.exports = { avisar };
