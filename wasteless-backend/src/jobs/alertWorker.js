// src/jobs/alertWorker.js
import pool from "../db.js";

export async function runAlertJob({ windowDays = 3 } = {}) {
  // 1) Build candidate sets
  const expiringSoon = await pool.query(
    `
    WITH nowdate AS (SELECT CURRENT_DATE AS today)
    SELECT item_id, name, expiry_date
    FROM items, nowdate
    WHERE expiry_date IS NOT NULL
      AND expiry_date <= (nowdate.today + INTERVAL '${Number(windowDays)} day')
    `
  );

  const lowStock = await pool.query(
    `
    SELECT item_id, name, quantity, reorder_level
    FROM items
    WHERE reorder_level IS NOT NULL
      AND quantity <= reorder_level
    `
  );

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 2) Insert expiring alerts (guard against duplicates for today)
    for (const r of expiringSoon.rows) {
      await client.query(
        `
        INSERT INTO alerts (item_id, alert_type, message)
        SELECT $1, 'expiring', $2
        WHERE NOT EXISTS (
          SELECT 1
          FROM alerts
          WHERE item_id = $1
            AND alert_type = 'expiring'
            AND created_at::date = CURRENT_DATE
        )
        `,
        [r.item_id, `Item "${r.name}" expiring on ${r.expiry_date}`]
      );
    }

    // 3) Insert low stock alerts (guard against duplicates for today)
    for (const r of lowStock.rows) {
      await client.query(
        `
        INSERT INTO alerts (item_id, alert_type, message)
        SELECT $1, 'low_stock', $2
        WHERE NOT EXISTS (
          SELECT 1
          FROM alerts
          WHERE item_id = $1
            AND alert_type = 'low_stock'
            AND created_at::date = CURRENT_DATE
        )
        `,
        [r.item_id, `Low stock for "${r.name}": qty=${r.quantity}, reorder=${r.reorder_level}`]
      );
    }

    await client.query("COMMIT");
    return {
      expiring_candidates: expiringSoon.rowCount,
      low_stock_candidates: lowStock.rowCount,
      note: "Duplicates avoided via WHERE NOT EXISTS",
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
