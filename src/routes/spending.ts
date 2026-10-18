import express from "express";
import pool from "../db.ts";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const queryResult = await pool.query(
      `SELECT
         COALESCE(c.classification, 'Unknown') AS classification,
         COALESCE(
           SUM(ABS(t.amount)) FILTER (WHERE t.amount < 0),
           0
         ) AS total
       FROM transactions t
       LEFT JOIN classifications c
         ON LOWER(c.recipient) = LOWER(t.recipient)
       GROUP BY COALESCE(c.classification, 'Unknown')
       ORDER BY classification`,
    );

    const categories = [
      "Household",
      "Transport",
      "Food",
      "Entertainment",
      "Unknown",
    ];

    const totals = new Map<string, number>(
      queryResult.rows.map((row) => [row.classification, Number(row.total)]),
    );

    const spending = categories.map((classification) => ({
      classification,
      total: totals.get(classification) ?? 0,
    }));

    return res.status(200).json({
      message: "Spending per category",
      spending,
    });
  } catch (error: unknown) {
    return res.status(500).json({
      message: "Something went wrong with spending",
    });
  }
});

export default router;
