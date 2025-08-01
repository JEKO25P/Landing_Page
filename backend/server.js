require('dotenv').config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { initializeDatabase, getPool } = require("./db"); // db.js actualizado con reintentos
const verifyToken = require('./authMiddleware');

const app = express();

// Configurar CORS 
app.use(cors({
  origin: ["http://localhost:3240", "http://167.172.150.250:3240", "http://3240.efdiaz.xyz" , 'http://www.3240.efdiaz.xyz' ,"https://projectlanding.vercel.app"], // reemplaza con tu dominio real
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Usuario de prueba
const User = {
  id: 1,
  email: 'admin@gmail.com',
  password: bcrypt.hashSync('123456', 8),
};

// Ruta principal
app.get("/", (req, res) => {
  res.send(" Backend funcionando correctamente");
});

// Ruta de login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (email !== User.email || !bcrypt.compareSync(password, User.password)) {
    return res.status(401).json({ message: 'Correo o Contraseña incorrectos' });
  }

  const token = jwt.sign(
    { id: User.id, email: User.email },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  res.json({ token });
});

// Configuración de reCAPTCHA
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
    return response.data;
  } catch (error) {
    console.error('Error en reCAPTCHA:', error.message);
    return { success: false };
  }
}

// POST /api/contact
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, phone, message, token } = req.body; // token será el recaptchaToken
    const status = 'nuevo';

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Nombre, email y mensaje son obligatorios" });
    }

    if (!token) {
      return res.status(400).json({ error: "Falta verificación de reCAPTCHA" });
    }

    const recaptchaResult = await verifyRecaptcha(token);
    if (!recaptchaResult.success) {
      return res.status(400).json({ error: "Verificación de reCAPTCHA falló" });
    }

    const [result] = await getPool().query(`
      INSERT INTO contacts (name, email, phone, message, recaptcha_score, status)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, phone || null, message, recaptchaResult.score || null, status]
    );

    res.status(200).json({ success: true, id: result.insertId, message: "Contacto guardado exitosamente" });

  } catch (error) {
    console.error('💥 Error en /api/contact:', error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET /api/contacts (con token verificado)
app.get("/api/contacts", verifyToken, async (req, res) => {
  try {
    const [rows] = await getPool().query("SELECT * FROM contacts ORDER BY created_at DESC");
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
    const [result] = await getPool().query(
      `UPDATE contacts SET status = ? WHERE id = ?`,
      [status, id]
    );
    res.json({ success: true, updated: result.affectedRows });
  } catch (err) {
    console.error("❌ Error al actualizar estado:", err);
    res.status(500).json({ error: "Error al actualizar estado" });
  }
});

// Middleware de error global
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor solo cuando la base de datos esté lista
initializeDatabase().then(() => {
  const PORT = process.env.PORT || 3227;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor escuchando en ${PORT}`);
  });
}).catch(err => {
  console.error("No se pudo inicializar la base de datos:", err);
  process.exit(1); // Cierra el servidor si la BD no está disponible
});
