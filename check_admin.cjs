const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./transit.db');

db.serialize(() => {
  db.get("SELECT * FROM admins WHERE username = 'admin'", (err, row) => {
    if (row) {
      console.log("Admin account found:", row);
    } else {
      console.log("Admin account NOT found. Creating...");
      db.run("INSERT INTO admins (id, username, password, name) VALUES (?, ?, ?, ?)", 
        ['admin_1', 'admin', 'password@123', 'System Admin'], (err) => {
          if (err) console.error("Error creating admin:", err);
          else console.log("Admin account created successfully.");
        });
    }
  });
});

setTimeout(() => db.close(), 2000);
