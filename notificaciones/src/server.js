const app = require("./app");
const { registro } = require("./registro");

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  registro.info({ puerto: PORT }, `Servicio de notificaciones escuchando en el puerto ${PORT}`);
});
