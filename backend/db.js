require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST,         // ejemplo: containers-us-west-123.railway.app
  user: process.env.DB_USER,         // ejemplo: root
  password: process.env.DB_PASSWORD, // la contraseña proporcionada por Railway
  database: process.env.DB_NAME,     // nombre de la base de datos, también en Railway
  port: process.env.DB_PORT          // generalmente 3306 o el puerto de Railway
}).promise();

// Crear tabla si no existe
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        message TEXT NOT NULL,
        recaptcha_score FLOAT,
        status VARCHAR(20) DEFAULT 'nuevo',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla "contacts" verificada o creada.');
  } catch (error) {
    console.error('💥 Error al inicializar la base de datos:', error);
  }
}

// Llamar a la función al cargar el módulo
initializeDatabase();

module.exports = pool;
