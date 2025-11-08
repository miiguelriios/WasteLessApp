import express from "express";
import pool from "../db.js";

const router = express.Router();

// Get all alerts
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.alert_id, i.name AS item_name, a.alert_type, a.message, a.created_at
       FROM alerts a
       JOIN items i ON a.item_id = i.item_id
       ORDER BY a.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Add new alert manually
router.post("/", async (req, res) => {
  const { item_id, alert_type, message } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO alerts (item_id, alert_type, message) VALUES ($1, $2, $3) RETURNING *",
      [item_id, alert_type, message]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding alert");
  }
});

export default router;
