const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./db");

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post("/api/contact", (req, res) => {
  const { name, email, phone, message } = req.body;
  const stmt = db.prepare("INSERT INTO contacts (name, email, phone, message) VALUES (?, ?, ?, ?)");
  stmt.run(name, email, phone, message, function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error al guardar en la base de datos." });
    }
    console.log("Contacto guardado con ID:", this.lastID);

    // Mostrar todos los contactos después de guardar uno
    db.all("SELECT * FROM contacts", [], (err, rows) => {
      if (err) {
        console.error("Error al leer contactos:", err);
      } else {
        console.log("Lista de todos los contactos:");
        console.table(rows);
      }
    });

    res.status(200).json({ success: true, id: this.lastID });
  });
});

app.listen(3000, () => {
  console.log("Servidor escuchando en http://localhost:3000");
});



db.all("SELECT * FROM contacts", [], (err, rows) => {
  if (err) {
    console.error("Error al leer los contactos:", err);
  } else {
    console.log("Contactos guardados en la base de datos:");
    console.table(rows);
  }
});
