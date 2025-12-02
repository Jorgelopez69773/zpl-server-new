import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

app.post("/", async (req, res) => {
  try {
    console.log("POST recibido:", req.body);

    // ---- ACA HACES TU LÓGICA ----
    // guardar archivo
    // generar etiqueta
    // subir a Drive
    // lo que quieras

    res.json({ status: "ok", mensaje: "Webhook recibido" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", mensaje: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor activo en puerto " + PORT));
