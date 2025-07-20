const mysql = require('mysql2/promise');

// Crear conexión MySQL (usa el puerto 300 si es necesario)
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'contact_form',
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Crear tabla si no existe
async function initializeDatabase() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        message TEXT NOT NULL,
        recaptcha_score FLOAT,
        status VARCHAR(50) DEFAULT 'nuevo',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await db.query(createTableQuery);
    console.log('✅ Tabla "contacts" verificada o creada.');
  } catch (err) {
    console.error('💥 Error al inicializar la base de datos:', err);
  }
}

// Inicializa al cargar el módulo
initializeDatabase();

module.exports = db;