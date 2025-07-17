require('dotenv').config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const path = require("path");
const db = require("./db"); // Ya es el mysql2.createPool
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const User = {
  id: 1,
  email: 'admin@gmail.com',
  password: bcrypt.hashSync('123456', 8),
};

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

// reCAPTCHA
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

async function verifyRecaptcha(token) {
  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      new URLSearchParams({
        secret: RECAPTCHA_SECRET_KEY,
        response: token
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
    console.log('🔍 Respuesta de reCAPTCHA:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error en la petición a reCAPTCHA:', error.message);
    return { success: false, 'error-codes': ['request-failed'] };
  }
}

// POST /api/contact
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, phone, message, 'g-recaptcha-response': recaptchaToken } = req.body;
    const status = 'nuevo';

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

    const [result] = await db.query(`
      INSERT INTO contacts (name, email, phone, message, recaptcha_score, status)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, phone || null, message, null, status]
    );

    console.log('✅ Contacto guardado con ID:', result.insertId);
    res.status(200).json({ success: true, id: result.insertId, message: "Contacto guardado exitosamente" });

  } catch (error) {
    console.error('💥 Error en /api/contact:', error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET /api/contacts
app.get("/api/contacts", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM contacts ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    console.error("Error al leer los contactos:", err);
    res.status(500).json({ error: "Error al leer los contactos" });
  }
});

// PUT /api/contacts/:id/status
app.put("/api/contacts/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE contacts SET status = ? WHERE id = ?`,
      [status, id]
    );
    res.json({ success: true, updated: result.affectedRows });
  } catch (err) {
    console.error("❌ Error al actualizar estado:", err);
    res.status(500).json({ error: "Error al actualizar estado" });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(3000, () => {
  console.log("🚀 Servidor escuchando en http://localhost:3000");
});
