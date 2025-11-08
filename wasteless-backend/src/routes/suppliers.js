import express from "express";
import pool from "../db.js";

const router = express.Router();

// ✅ Get all suppliers
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM suppliers ORDER BY supplier_id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// ✅ Add new supplier
router.post("/", async (req, res) => {
  const { name, contact_info, address } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO suppliers (name, contact_info, address) VALUES ($1, $2, $3) RETURNING *",
      [name, contact_info, address]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding supplier");
  }
});

export default router;
