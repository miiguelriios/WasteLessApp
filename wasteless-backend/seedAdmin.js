// seedAdmin.js
import bcrypt from "bcrypt";
import pool from "./src/db.js";

async function main() {
  const name = "Admin";
  const email = "admin@zerowasteone.local";
  const password = "admin123"; // change after first login
  const hash = await bcrypt.hash(password, 10);

  await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO NOTHING`,
    [name, email, hash]
  );
  console.log("✅ Admin seeded:", email, "(password:", password, ")");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
