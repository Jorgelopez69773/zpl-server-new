import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import { google } from "googleapis";
import { Readable } from "stream";

const app = express();
app.use(bodyParser.json());

/* ============================
   🔐 GOOGLE DRIVE AUTH
============================ */
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_KEY),
  scopes: ["https://www.googleapis.com/auth/drive.file"],
});
const drive = google.drive({ version: "v3", auth });

/* ============================
   📥 ENDPOINT PRINCIPAL
============================ */
app.post("/zpl", async (req, res) => {
  try {
    const { numero, codigo, carpetaId } = req.body;

    // Validación
    if (!numero || !codigo || !carpetaId) {
      return res.status(400).json({
        error: "Faltan parámetros: numero, codigo o carpetaId",
      });
    }

    /* ============================
       🖨️ ZPL DINÁMICO
    ============================ */
    const zpl = `
^XA
~TA000
~JSN
^LT0
^MNW
^MTT
^PON
^PMN
^LH0,0
^JMA
^PR5,5
~SD10
^JUS
^LRN
^CI27
^PA0,1,1,0
^XZ
^XA
^MMT
^PW295
^LL591
^LS0
^FO9,11^GB278,568,2^FS
^FO123,14^GB0,284,2^FS
^FT88,36^A0R,25,15^FH\\^CI28^FDProducto:Bomba Autocebante  0,75HP^FS^CI27
^FT57,36^A0R,25,15^FH\\^CI28^FDPotencia:120w^FS^CI27
^FT26,36^A0R,25,15^FH\\^CI28^FDCaudal:12m3/h^FS^CI27
^FO9,295^GB278,0,2^FS
^FT255,0^A0R,25,25^FB297,1,6,C^FH\\^CI28^FDBomba Autocebante\\^FS^CI27
^FT224,0^A0R,25,25^FB297,1,6,C^FH\\^CI28^FDN°:\\^FS^CI27
^FT156,62^A0R,50,63^FH\\^CI28^FD${numero}^FS^CI27
^FT45,573^BQN,2,10
^FH\\^FDLA,${codigo}^FS
^LRY^FO143,57^GB0,189,59^FS
^LRN
^PQ1,,,Y
^XZ
    `;

    /* ============================
       🖼️ Convertir ZPL → PNG
    ============================ */
    const labelary = await fetch(
      "http://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/",
      {
        method: "POST",
        headers: { "Content-Type": "application/zpl" },
        body: zpl,
      }
    );

    if (!labelary.ok) {
      throw new Error("Error en Labelary: " + (await labelary.text()));
    }

    const pngBuffer = Buffer.from(await labelary.arrayBuffer());

    /* ============================
       📤 Subir PNG a Google Drive
    ============================ */
    const metadata = {
      name: `${numero}.png`,
      parents: [carpetaId], // 📌 viene desde AppSheet
    };

    const media = {
      mimeType: "image/png",
      body: Readable.from(pngBuffer),
    };

    const upload = await drive.files.create({
      resource: metadata,
      media,
      fields: "id",
    });

    /* ============================
       ✅ RESPUESTA
    ============================ */
    res.json({
      status: "ok",
      mensaje: "Etiqueta generada y subida correctamente",
      fileId: upload.data.id,
    });
  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ error: error.toString() });
  }
});

/* ============================
   🚀 INICIAR SERVIDOR
============================ */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Servidor activo en puerto " + PORT);
});

