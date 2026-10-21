import express from "express";
import pool from "../db.ts";
import { classificationEnum } from "../schemas.ts";

const router = express.Router();

// Spending per category
// only outgoing transactions (amount < 0) are counted

router.get("/", async (_req, res) => {
  try {
    const queryResult = await pool.query(
      `SELECT
         COALESCE(c.classification, 'Unknown') AS classification,
         SUM(ABS(t.amount)) AS total,
         COUNT(*) AS count
       FROM transactions t
       LEFT JOIN classifications c
         ON LOWER(c.recipient) = LOWER(t.recipient)
       WHERE t.amount < 0
       GROUP BY COALESCE(c.classification, 'Unknown')
       ORDER BY classification`,
    );

    // show all categories, also the ones with no spending (total 0)
    const spending = classificationEnum.options.map((classification) => {
      const row = queryResult.rows.find(
        (row) => row.classification === classification,
      );

      return {
        classification,
        total: row ? Number(row.total) : 0,
        count: row ? Number(row.count) : 0,
      };
    });

    return res.status(200).json({
      message: "Spending per category",
      spending,
    });
  } catch (_error: unknown) {
    return res.status(500).json({
      message: "Something went wrong with spending",
    });
  }
});

export default router;
