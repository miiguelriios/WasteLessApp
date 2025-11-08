import express from "express";
import dotenv from "dotenv";
import itemsRouter from "./routes/items.js";
import pool from "./db.js"; // use centralized connection

dotenv.config();

const app = express();
app.use(express.json());

// Routes
app.use("/items", itemsRouter);

// Test route
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.send(`Database connected successfully! Server time: ${result.rows[0].now}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database connection failed");
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(` Server running on http://localhost:${PORT}`));
