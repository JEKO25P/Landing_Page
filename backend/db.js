const sqlite3 = require("sqlite3").verbose();
const path = require('path');
const fs = require('fs');

// Crear la base de datos en la carpeta actual
const dbPath = path.join(__dirname, 'contact.db');

// Eliminar la base de datos existente para empezar limpio
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Base de datos anterior eliminada');
}

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Crear la tabla completa con todas las columnas desde el principio
  db.run(`
    CREATE TABLE contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      message TEXT NOT NULL,
      recaptcha_score REAL,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creando tabla:', err);
    } else {
      console.log('Tabla contacts creada exitosamente con todas las columnas');
    }
  });
});

// Manejar errores de la base de datos
db.on('error', (err) => {
  console.error('Error de base de datos:', err);
});

console.log('Base de datos inicializada en:', dbPath);

module.exports = db;