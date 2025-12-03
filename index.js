import express from "express";
import fetch from "node-fetch";

const app = express();

// ----------------- ENDPOINT PARA APP
app.get("/zpl", async (req, res) => {
  try {
    const { numero, codigo , tipo , potencia , caudal } = req.query;

    if (!numero || !codigo || !tipo || !potencia || !caudal) {
      return res.status(400).json({ error: "Faltan parámetros: numero o codigo" });
    }

    // ----------------- ZPL DINÁMICO
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
^FT88,36^A0R,25,15^FH\\^CI28^FDProducto:Bomba Autocebante ${tipo}^FS^CI27
^FT57,36^A0R,25,15^FH\\^CI28^FDPotencia:${potencia}^FS^CI27
^FT26,36^A0R,25,15^FH\\^CI28^FDCaudal:${caudal}^FS^CI27
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

    // ----------------- Convertir ZPL a PNG usando Labelary
    const labelary = await fetch(
      "http://api.labelary.com/v1/printers/12dpmm/labels/0.984252x1.9685/0/",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: zpl,
      }
    );

    if (!labelary.ok) throw new Error(await labelary.text());

    const pngBuffer = Buffer.from(await labelary.arrayBuffer());

    // ----------------- Devolver PNG directamente
    res.setHeader("Content-Type", "image/png");
    res.send(pngBuffer);

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ error: error.toString() });
  }
});

// ----------------- INICIAR SERVIDOR
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Servidor activo en puerto " + PORT));
