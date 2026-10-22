const { trace } = require("@opentelemetry/api");

const trazador = trace.getTracer("tareas-api");

async function conSpan(nombre, atributos, fn) {
  return trazador.startActiveSpan(nombre, async (span) => {
    try {
      if (atributos) {
        span.setAttributes(atributos);
      }
      return await fn(span);
    } catch (e) {
      span.recordException(e);
      throw e;
    } finally {
      span.end();
    }
  });
}

module.exports = { conSpan };
