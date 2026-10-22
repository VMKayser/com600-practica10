# Práctica N.º 10 — Observabilidad: Métricas, Registros y Trazas

**Asignatura:** COM-600 Microservicios — Gestión 2/2026  
**Estudiante:** Freddy Daniel Valencia Medina  
**CU:** 35-5808  
**Carrera:** Ingeniería de Sistemas  
**Universidad:** Universidad Mayor, Real y Pontificia de San Francisco Xavier de Chuquisaca  

---

## 1. Orden de Arranque del Sistema

### 1.1. Levantar la Pila de Observabilidad
Para iniciar los 6 contenedores auxiliares de observabilidad (Prometheus, Grafana, Jaeger, Elasticsearch, Logstash y Kibana):

```bash
docker compose -f docker-compose.obs.yml up -d
docker compose -f docker-compose.obs.yml ps
```

### 1.2. Instalar Dependencias de los Servicios
```bash
# Dependencias de tareas-api
npm install

# Dependencias de notificaciones
cd notificaciones && npm install && cd ..
```

### 1.3. Iniciar los Servicios Instrumentados

* **Terminal 1 (tareas-api en puerto 3000):**
  ```bash
  SERVICIO=tareas-api node -r ./src/telemetria.js src/server.js
  ```

* **Terminal 2 (notificaciones en puerto 3001):**
  ```bash
  SERVICIO=notificaciones node -r ./notificaciones/src/telemetria.js notificaciones/src/server.js
  ```

---

## 2. Puertos y Servicios de Observabilidad

| Instrumento | Puerto | Función |
| :--- | :--- | :--- |
| **Prometheus** | `9090` | Recolección periódica (pull/scrape) de métricas en formato texto y evaluación de alertas |
| **Grafana** | `3300` | Visualización en tableros con percentiles ($p95, p99$), RPS y tasa de errores (credenciales: `admin`/`com600`) |
| **Jaeger UI** | `16686` | Interfaz visual para análisis de cascadas de trazas y spans distribuidos |
| **Jaeger OTLP** | `4318` | Receptor HTTP OpenTelemetry Protocol (OTLP) |
| **Elasticsearch**| `9200` | Motor de búsqueda y almacenamiento de eventos JSON estructurados |
| **Kibana** | `5601` | Interfaz visual para filtrado y consulta de registros centralizados |
| **tareas-api** | `3000` | Servicio REST principal |
| **notificaciones**| `3001` | Servicio auxiliar de avisos |

---

## 3. Definición de Objetivos de Servicio (SLI / SLO)

### Indicador de Nivel de Servicio (SLI)
Proporción de peticiones exitosas (código HTTP distinto de `5xx`) respecto al total de peticiones dirigidas al servicio de tareas en ventanas móviles:

$$\text{SLI} = \frac{\sum \text{rate}(http\_request\_duration\_seconds\_count\{codigo!\sim"5.."\} [5m])}{\sum \text{rate}(http\_request\_duration\_seconds\_count [5m])}$$

### Objetivo de Nivel de Servicio (SLO)
**99,0 % de peticiones correctas** en una ventana móvil de 30 días.

### Presupuesto de Error (Error Budget)
**1,0 % de las peticiones permitidas con error.**  
Para un volumen estimado de 100 000 peticiones al mes, el equipo tiene un presupuesto de hasta 1 000 peticiones con error antes de incumplir el acuerdo con los usuarios y detener despliegues riesgosos.

---

## 4. Regla de Alerta de Prometheus

Ubicada en `prometheus/reglas.yml`:
* **Nombre:** `TasaDeErroresAlta`
* **Condición:** Error rate superior al 5 % (`> 0.05`) sostenido durante 2 minutos (`for: 2m`).
* **Severidad:** Crítica.
* **Acción:** Revisar tablero de salud en Grafana, filtrar logs por minuto en Kibana y rastrear el `traceId` en Jaeger.
