import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

// Create a connection pool
const pool = new Pool({
  user: String(process.env.PGUSER || "postgres"),
  host: String(process.env.PGHOST || "localhost"),
  database: String(process.env.PGDATABASE || "wastelessdb"),
  password: String(process.env.PGPASSWORD || "Miguelrm"),   
  port: Number(process.env.PGPORT || 5432),         
});

// Optional: test connection on startup
pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL database"))
  .catch((err) => console.error("❌ Database connection error:", err));

export default pool;
