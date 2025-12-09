import express from "express";
import pool from "../db.js";

const router = express.Router();

// Get all items
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM items ORDER BY item_id ASC");
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

// UPDATE item
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, category_id, supplier_id, quantity, unit, expiry_date, reorder_level } = req.body;
  try {
    const result = await pool.query(
      `UPDATE items
       SET name=$1, category_id=$2, supplier_id=$3, quantity=$4, unit=$5, expiry_date=$6, reorder_level=$7
       WHERE item_id=$8
       RETURNING *`,
      [name, category_id, supplier_id, quantity, unit, expiry_date, reorder_level, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update item" });
  }
});

// DELETE /items/:id
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid item id" });
  }

  try {
    // 1) delete any alerts for this item
    await pool.query("DELETE FROM alerts WHERE item_id = $1", [id]);

    // 2) delete the item itself
    const result = await pool.query("DELETE FROM items WHERE item_id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    return res.status(204).send(); // success, no content
  } catch (err) {
    console.error("Error deleting item:", err);
    return res.status(500).json({ error: "Failed to delete item" });
  }
});


// 📊 Stats for dashboard
router.get("/stats", async (_req, res) => {
  try {
    const result = await pool.query(
      `
      WITH nowdate AS (
        SELECT CURRENT_DATE AS today
      )
      SELECT
        -- total items
        (SELECT COUNT(*) FROM items) AS total_items,

        -- soon expiring (<= 3 days, and expiry_date not null)
        (SELECT COUNT(*) FROM items, nowdate
           WHERE expiry_date IS NOT NULL
             AND expiry_date <= (nowdate.today + INTERVAL '3 day')) AS expiring_soon,

        -- low stock (quantity <= reorder_level and reorder_level not null)
        (SELECT COUNT(*) FROM items
           WHERE reorder_level IS NOT NULL
             AND quantity <= reorder_level) AS low_stock
      ;
      `
    );

    const nextToExpire = await pool.query(
      `
      SELECT item_id, name, quantity, unit, expiry_date
      FROM items
      WHERE expiry_date IS NOT NULL
      ORDER BY expiry_date ASC
      LIMIT 5;
      `
    );

    const byCategory = await pool.query(
      `
      SELECT COALESCE(c.name, 'Uncategorized') AS category, COUNT(*) AS count
      FROM items i
      LEFT JOIN categories c ON c.category_id = i.category_id
      GROUP BY category
      ORDER BY count DESC;
      `
    );

    // ⬇️ NEW: low stock list (ordered by how far below reorder level)
    const lowStockList = await pool.query(`
      SELECT item_id, name, quantity, unit, reorder_level
      FROM items
      WHERE reorder_level IS NOT NULL
        AND quantity <= reorder_level
      ORDER BY (quantity - reorder_level) ASC, name ASC
      LIMIT 10
    `);    

    res.json({
      ...result.rows[0],
      nextToExpire: nextToExpire.rows,
      byCategory: byCategory.rows,
      lowStockList: lowStockList.rows, // ⬅️ include new list
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to compute stats" });
  }
});

export default router;
