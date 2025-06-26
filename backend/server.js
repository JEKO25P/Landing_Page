require('dotenv').config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const path = require("path");
const db = require("./db");

const app = express();
app.use(cors({
  origin: 'http://127.0.0.1:5500', // O usa '*' para desarrollo (no recomendado en producción)
  methods: ['GET', 'POST']
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Configuración de reCAPTCHA - Usar variable de entorno
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || '6Lf2724rAAAAACf2IZ_zSBUrgLMf3-IXxoGwcW0a';

// Función para verificar reCAPTCHA v2 (mostrará siempre la respuesta en consola)
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
    return { 
      success: false, 
      'error-codes': ['request-failed'] 
    };
  }
}

// Ruta /api/contact (manejo mejorado del CAPTCHA)
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, phone, message, 'g-recaptcha-response': recaptchaToken } = req.body;
    
    console.log('Datos recibidos:', { name, email, phone });

    // Validar campos requeridos
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Nombre, email y mensaje son obligatorios" });
    }
    
    // Validar reCAPTCHA v2
    if (!recaptchaToken) {
      const errorResponse = {
        success: false,
        'error-codes': ['missing-input-response']
      };
      console.log('Token faltante:', JSON.stringify(errorResponse, null, 2));
      return res.status(400).json({ error: "Completa el CAPTCHA", recaptchaError: errorResponse });
    }
    
    console.log('🔍 Verificando reCAPTCHA...');
    const recaptchaResult = await verifyRecaptcha(recaptchaToken); // ← Aquí se muestra la respuesta
    
    if (!recaptchaResult.success) {
      return res.status(400).json({ 
        error: 'Error en CAPTCHA',
        recaptchaError: recaptchaResult 
      });
    }
    
    const stmt = db.prepare(`
      INSERT INTO contacts (name, email, phone, message, recaptcha_score) 
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(name, email, phone || null, message, null, function (err) {
      if (err) {
        console.error('Error en DB:', err);
        return res.status(500).json({ error: "Error al guardar" });
      }
      
      console.log('Contacto guardado (ID:', this.lastID + ')');
      res.status(200).json({ success: true, id: this.lastID });
    });
    
  } catch (error) {
    console.error('Error en /api/contact:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Ruta principal para servir el HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, phone, message, recaptchaToken } = req.body;
    
    console.log('Datos recibidos:');
    console.log('- Nombre:', name);
    console.log('- Email:', email);
    console.log('- Token recibido:', recaptchaToken ? 'Sí' : 'No');
    
    // Validar campos requeridos
    if (!name || !email || !message) {
      return res.status(400).json({ 
        error: "Nombre, email y mensaje son campos obligatorios" 
      });
    }
    
    // Validar reCAPTCHA v2
    if (!recaptchaToken) {
      console.log('Token de reCAPTCHA faltante');
      return res.status(400).json({ 
        error: "reCAPTCHA es obligatorio" 
      });
    }
    
    if (typeof recaptchaToken !== 'string' || recaptchaToken.trim().length === 0) {
      console.log('Token de reCAPTCHA inválido');
      return res.status(400).json({ 
        error: "Token de reCAPTCHA inválido" 
      });
    }
    
    console.log('Verificando reCAPTCHA v2...');
    
    // Verificar reCAPTCHA v2 con Google
    const recaptchaResult = await verifyRecaptcha(recaptchaToken);
    
    console.log('Respuesta de Google reCAPTCHA:', JSON.stringify(recaptchaResult, null, 2));
    
    if (!recaptchaResult.success) {
      console.log('reCAPTCHA falló:', recaptchaResult['error-codes']);
      return res.status(400).json({ 
        error: 'Verificación de reCAPTCHA falló. Por favor, inténtalo de nuevo.' 
      });
    }
    
    console.log('reCAPTCHA verificado exitosamente');
    
    // Guardar en base de datos (sin score para v2)
    const stmt = db.prepare(`
      INSERT INTO contacts (name, email, phone, message, recaptcha_score) 
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(name, email, phone || null, message, null, function (err) {
      if (err) {
        console.error('Error al guardar en la base de datos:', err);
        return res.status(500).json({ error: "Error al guardar en la base de datos." });
      }
      
      console.log("Contacto guardado con ID:", this.lastID);

      // Mostrar todos los contactos después de guardar uno
      db.all("SELECT * FROM contacts ORDER BY created_at DESC", [], (err, rows) => {
        if (err) {
          console.error("Error al leer contactos:", err);
        } else {
          console.log("Lista de todos los contactos:");
          console.table(rows);
        }
      });

      res.status(200).json({ 
        success: true, 
        id: this.lastID,
        message: "Contacto guardado exitosamente"
      });
    });
    
    stmt.finalize();
    
  } catch (error) {
    console.error(' Error procesando formulario:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
});

// Ruta para obtener todos los contactos (opcional, para administración)
app.get("/api/contacts", (req, res) => {
  db.all("SELECT * FROM contacts ORDER BY created_at DESC", [], (err, rows) => {
    if (err) {
      console.error("Error al leer los contactos:", err);
      return res.status(500).json({ error: "Error al leer los contactos" });
    }
    res.json(rows);
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Para una SPA (Single Page Application), redirige al index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

app.listen(3000, () => {
  console.log("Servidor escuchando en http://localhost:3000");
  
  // Mostrar contactos existentes al iniciar
  db.all("SELECT * FROM contacts ORDER BY created_at DESC", [], (err, rows) => {
    if (err) {
      console.error("Error al leer los contactos:", err);
    } else if (rows.length > 0) {
      console.log("Contactos guardados en la base de datos:");
      console.table(rows);
    } else {
      console.log(" No hay contactos guardados aún");
    }
  });
});