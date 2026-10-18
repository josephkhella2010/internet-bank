import express from "express";
import pool from "../db.ts";
import { transactionsWithClassificationSchema } from "../schemas.ts";

const router = express.Router();

// Filter transactions by date

router.get("/", async (req, res) => {
  try {
    const { from, to } = req.query;

    if (typeof from !== "string" || typeof to !== "string") {
      return res.status(400).json({
        message: "From date and to date are required",
      });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateRegex.test(from) || !dateRegex.test(to)) {
      return res.status(400).json({
        message: "Date must be in YYYY-MM-DD format",
      });
    }

    if (from > to) {
      return res.status(400).json({
        message: "From date cannot be after to date",
      });
    }
    const queryResult = await pool.query(
      `SELECT
     t.id,
     TO_CHAR(t.date, 'YYYY-MM-DD') AS date,
     t.recipient,
     t.amount,
     c.classification
   FROM transactions t
   LEFT JOIN classifications c
     ON LOWER(c.recipient) = LOWER(t.recipient)
   WHERE t.date BETWEEN $1::date AND $2::date
   ORDER BY t.date ASC`,
      [from, to],
    );
    console.log(queryResult.rows);
    const parsed = transactionsWithClassificationSchema.safeParse(
      queryResult.rows,
    );

    if (!parsed.success) {
      console.error("Invalid transaction data:", parsed.error);

      return res.status(500).json({
        message: "Invalid transaction data returned from database",
      });
    }

    return res.status(200).json({
      message: "Successfully filtered transactions",
      transactions: parsed.data,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong while filtering transactions",
    });
  }
});

export default router;
