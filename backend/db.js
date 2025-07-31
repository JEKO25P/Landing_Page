const mysql = require('mysql2/promise');

let db;

// Función para crear el pool de conexión
async function createPool() {
  return mysql.createPool({
    host: process.env.DB_HOST || 'mysql_container',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'rootpass',
    database: process.env.DB_NAME || 'contact_form',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

// Función para inicializar la base de datos con reintentos
async function initializeDatabase(retries = 10, delay = 5000) {
  while (retries) {
    try {
      db = await createPool();
      console.log('Intentando conectar a la base de datos...');
      await db.query('SELECT 1');
      console.log('Conexión establecida con la base de datos MySQL.');

      // Crear tabla si no existe
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
      console.log('Tabla "contacts" verificada o creada.');
      return db;

    } catch (err) {
      console.error(`Error al conectar a la base de datos: ${err.message}`);
      retries -= 1;
      if (!retries) throw new Error('No se pudo conectar a MySQL después de varios intentos.');
      console.log(`Reintentando en ${delay / 1000} segundos... (${retries} intentos restantes)`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

// Exportamos el pool de conexión
module.exports = {
  initializeDatabase,
  getPool: () => db
};
