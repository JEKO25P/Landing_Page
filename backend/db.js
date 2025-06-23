//Ejecutar 
//npm install express cors body-parser sqlite3

const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./contact.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      phone TEXT,
      message TEXT
    )
  `);
});

module.exports = db;
