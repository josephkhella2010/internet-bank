import express from "express";
import pool from "../db.ts";
import {
  dateFilterQuerySchema,
  transactionsWithClassificationSchema,
} from "../schemas.ts";
import { validate } from "../middleware/validate.ts";

const router = express.Router();

// Filter transactions by date

router.get("/", validate(dateFilterQuerySchema, "query"), async (req, res) => {
  try {
    const { from, to } = req.query;

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
  } catch (_error) {
    return res.status(500).json({
      message: "Something went wrong while filtering transactions",
    });
  }
});

export default router;
