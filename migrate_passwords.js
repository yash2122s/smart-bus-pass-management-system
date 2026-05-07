import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const db = new sqlite3.Database(process.env.DB_PATH || './transit.db');
const SALT_ROUNDS = 10;

db.serialize(async () => {
  console.log("Upgrading existing credentials to bcrypt...");

  // Update Admins
  db.all("SELECT * FROM admins", async (err, rows) => {
    for (const admin of rows) {
      if (!admin.password.startsWith('$2b$')) {
        const hash = await bcrypt.hash(admin.password, SALT_ROUNDS);
        db.run("UPDATE admins SET password = ? WHERE id = ?", [hash, admin.id]);
        console.log(`Updated admin: ${admin.username}`);
      }
    }
  });

  // Update Users
  db.all("SELECT * FROM users", async (err, rows) => {
    for (const user of rows) {
      if (!user.password.startsWith('$2b$')) {
        const hash = await bcrypt.hash(user.password, SALT_ROUNDS);
        db.run("UPDATE users SET password = ? WHERE id = ?", [hash, user.id]);
        console.log(`Updated user: ${user.email}`);
      }
    }
  });

  console.log("Migration complete.");
});

setTimeout(() => db.close(), 3000);
