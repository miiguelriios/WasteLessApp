// index.js (root)
import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import pool from "./src/db.js";

import itemsRouter from "./src/routes/items.js";
import categoriesRouter from "./src/routes/categories.js";
import suppliersRouter from "./src/routes/suppliers.js";
import authRouter from "./src/routes/auth.js"; // <-- IMPORTANT

dotenv.config();

const app = express();

// middleware
app.use(cors({ origin: "http://localhost:3001", methods: ["GET","POST","PUT","DELETE","OPTIONS"] }));
app.use(express.json()); // <-- REQUIRED for reading JSON bodies

// sanity routes (to prove the server and /auth mount are alive)
app.get("/", async (_req, res) => {
  const r = await pool.query("SELECT NOW()");
  res.send(`OK @ ${r.rows[0].now}`);
});
app.get("/auth/_health", (_req, res) => res.json({ ok: true })); // <-- should return 200 if /auth is mounted

// mount routers
app.use("/items", itemsRouter);
app.use("/categories", categoriesRouter);
app.use("/suppliers", suppliersRouter);
app.use("/auth", authRouter); // <-- MOUNTED HERE

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
