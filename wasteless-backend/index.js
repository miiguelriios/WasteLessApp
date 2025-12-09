// index.js (root)
import cron from "node-cron";
import { runAlertJob } from "./src/jobs/alertWorker.js";

import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import pool from "./src/db.js";

import alertsRouter from "./src/routes/alerts.js";
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
app.use("/alerts", alertsRouter);
app.use("/items", itemsRouter);
app.use("/categories", categoriesRouter);
app.use("/suppliers", suppliersRouter);
app.use("/auth", authRouter); // <-- MOUNTED HERE

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));

// Manual trigger for testing (keep during dev)
app.post("/alerts/run", async (req, res) => {
  try {
    const windowDays = Number(process.env.ALERT_WINDOW_DAYS || 3);
    const result = await runAlertJob({ windowDays });
    res.json({ ok: true, ...result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Schedule daily run
if (process.env.ENABLE_ALERT_CRON === "true") {
  const cronExpr = process.env.CRON_SCHEDULE || "0 6 * * *"; // default 06:00 daily
  cron.schedule(cronExpr, async () => {
    try {
      const windowDays = Number(process.env.ALERT_WINDOW_DAYS || 3);
      const result = await runAlertJob({ windowDays });
      console.log("✅ Alert job ran:", result);
    } catch (e) {
      console.error("❌ Alert job failed:", e.message);
    }
  });
  console.log(`⏰ Alert cron scheduled: "${process.env.CRON_SCHEDULE}" (window=${process.env.ALERT_WINDOW_DAYS}d)`);
}
