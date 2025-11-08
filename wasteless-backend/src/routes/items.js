import express from "express";
import pool from "../db.js";

const router = express.Router();

// Get all items
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.item_id, i.name, i.quantity, i.unit, i.expiry_date, 
             c.name AS category, s.name AS supplier
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.category_id
      LEFT JOIN suppliers s ON i.supplier_id = s.supplier_id
      ORDER BY i.item_id;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

// Add new item
router.post("/", async (req, res) => {
  const { name, category_id, supplier_id, quantity, unit, expiry_date, reorder_level } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO items (name, category_id, supplier_id, quantity, unit, expiry_date, reorder_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *;`,
      [name, category_id, supplier_id, quantity, unit, expiry_date, reorder_level]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add item" });
  }
});

export default router;
