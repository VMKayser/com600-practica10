const app = require("./app");
const { registro } = require("./registro");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  registro.info({ puerto: PORT }, `Servicio de tareas escuchando en el puerto ${PORT}`);
});
