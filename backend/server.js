require('dotenv').config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const path = require("path");
const db = require("./db");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Usuario de prueba
const User = {
  id: 1,
  email: 'admin@gmail.com',
  password: bcrypt.hashSync('123456', 8),
};

// Ruta de login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (email !== User.email || !bcrypt.compareSync(password, User.password)) {
    return res.status(401).json({ message: 'Correo o Contraseña incorrectos' });
  }

  const token = jwt.sign(
    { id: User.id, email: User.email },
    process.env.JWT_SECRET || 'clave-super-secreta',
    { expiresIn: '2h' }
  );

  res.json({ token });
});

// Servir archivos estáticos del frontend (opcional)
app.use(express.static(path.join(__dirname, '../frontend_react')));

// Configuración de reCAPTCHA
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

// Función de verificación de reCAPTCHA
async function verifyRecaptcha(token) {
  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      new URLSearchParams({
        secret: RECAPTCHA_SECRET_KEY,
        response: token
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    console.log('🔍 Respuesta de reCAPTCHA:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error en la petición a reCAPTCHA:', error.message);
    return { success: false, 'error-codes': ['request-failed'] };
  }
}

// Ruta para recibir contacto con reCAPTCHA
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, phone, message, 'g-recaptcha-response': recaptchaToken } = req.body;
    const status = 'nuevo'; // Definimos status por defecto

    console.log('📥 Contacto recibido:', { name, email, phone, status });

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Nombre, email y mensaje son obligatorios" });
    }

    if (!recaptchaToken) {
      console.log('❌ Token de reCAPTCHA faltante');
      return res.status(400).json({ error: "Falta verificación de reCAPTCHA" });
    }

    const recaptchaResult = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaResult.success) {
      console.log('⚠️ Verificación reCAPTCHA fallida');
      return res.status(400).json({ error: "Verificación de reCAPTCHA falló" });
    }

    const stmt = db.prepare(`
      INSERT INTO contacts (name, email, phone, message, recaptcha_score, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(name, email, phone || null, message, null, status, function (err) {
      if (err) {
        console.error('💥 Error al guardar en DB:', err);
        return res.status(500).json({ error: "Error al guardar en la base de datos" });
      }

      console.log('✅ Contacto guardado con ID:', this.lastID);
      res.status(200).json({ success: true, id: this.lastID, message: "Contacto guardado exitosamente" });
    });

    stmt.finalize();
  } catch (error) {
    console.error('💥 Error en /api/contact:', error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});


// Obtener todos los contactos (opcional)
app.get("/api/contacts", (req, res) => {
  db.all("SELECT * FROM contacts ORDER BY created_at DESC", [], (err, rows) => {
    if (err) {
      console.error("Error al leer los contactos:", err);
      return res.status(500).json({ error: "Error al leer los contactos" });
    }
    res.json(rows);
  });
});

// Middleware de error global
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(3000, () => {
  console.log("🚀 Servidor escuchando en http://localhost:3000");

  // Mostrar contactos existentes al iniciar
  db.all("SELECT * FROM contacts ORDER BY created_at DESC", [], (err, rows) => {
    if (err) {
      console.error("Error al leer los contactos:", err);
    } else if (rows.length > 0) {
      console.log("Contactos guardados:");
      console.table(rows);
    } else {
      console.log("📝 No hay contactos guardados aún.");
    }
  });
});

// Actualizar estado de un contacto
app.put("/api/contacts/:id/status", (req, res) => {
  const { id } = req.params
  const { status } = req.body

  const stmt = db.prepare(`UPDATE contacts SET status = ? WHERE id = ?`)
  stmt.run(status, id, function (err) {
    if (err) {
      console.error("❌ Error al actualizar estado:", err)
      return res.status(500).json({ error: "Error al actualizar estado" })
    }
    res.json({ success: true, updated: this.changes })
  })
})
