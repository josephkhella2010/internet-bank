import express from "express";
import pool from "../db.ts";
import {
  createTransactionSchema,
  idParamsSchema,
  transactionWithClassificationSchema,
  transactionsWithClassificationSchema,
} from "../schemas.ts";
import { validate } from "../middleware/validate.ts";

const router = express.Router();

// Get all transactions

router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        t.id,
        TO_CHAR(t.date, 'YYYY-MM-DD') AS date,
        t.recipient,
        t.amount,
        CASE
          WHEN t.amount < 0
            THEN COALESCE(c.classification, 'Unknown')
          ELSE NULL
        END AS classification
      FROM transactions t
      LEFT JOIN classifications c
        ON LOWER(c.recipient) = LOWER(t.recipient)
      ORDER BY t.date DESC
    `);
    const parsed = transactionsWithClassificationSchema.safeParse(result.rows);
    return res.status(200).json({
      message: "successfully get all transtions",
      translations: parsed.data,
    });
  } catch (_error: unknown) {
    return res.status(500).json({
      message: "Something went wrong with get all transtions",
    });
  }
});

// Get transaction by ID
router.get("/:id", validate(idParamsSchema, "params"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await pool.query(
      `
      SELECT
        t.id,
        TO_CHAR(t.date, 'YYYY-MM-DD') AS date,
        t.recipient,
        t.amount,
        CASE
          WHEN t.amount < 0
            THEN COALESCE(c.classification, 'Unknown')
          ELSE NULL
        END AS classification
      FROM transactions t
      LEFT JOIN classifications c
        ON LOWER(c.recipient) = LOWER(t.recipient)
      WHERE t.id = $1
      ORDER BY t.date DESC
    `,
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    const parsed = transactionWithClassificationSchema.safeParse(
      result.rows[0],
    );

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid transaction data",
        error: parsed.error.flatten(),
      });
    }

    return res.status(200).json({
      message: "Successfully retrieved transaction",
      transaction: parsed.data,
    });
  } catch (_error: unknown) {
    return res.status(500).json({
      message: "Something went wrong with get transtion",
    });
  }
});

// post transaction by ID

router.post(
  "/",
  validate(createTransactionSchema, "body"),
  async (req, res) => {
    try {
      const { date, recipient, amount } = req.body;

      const queryResult = await pool.query(
        `WITH new_transaction AS (
     INSERT INTO transactions (date, recipient, amount)
     VALUES ($1, $2, $3)
     RETURNING id, date, recipient, amount
   )
   SELECT
     t.id,
     TO_CHAR(t.date, 'YYYY-MM-DD') AS date,
     t.recipient,
     t.amount,
     c.classification
   FROM new_transaction t
   LEFT JOIN classifications c
     ON LOWER(c.recipient) = LOWER(t.recipient)`,
        [date, recipient, amount],
      );

      const parsed = transactionWithClassificationSchema.safeParse(
        queryResult.rows[0],
      );
      if (!parsed.success) {
        console.error(
          "Invalid transaction returned from database:",
          parsed.error,
        );

        return res.status(500).json({
          message: "Invalid transaction data returned from database",
        });
      }

      return res.status(201).json({
        message: "Successfully added transaction",
        transaction: parsed.data,
      });
    } catch (error: unknown) {
      console.error(
        "Something went wrong with post request transaction:",
        error,
      );

      return res.status(500).json({
        message: "Something went wrong with post request transtion",
      });
    }
  },
);
//  update put transaction by ID

router.put(
  "/:id",
  validate(idParamsSchema, "params"),
  validate(createTransactionSchema, "body"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { date, recipient, amount } = req.body;

      const queryResult = await pool.query(
        `WITH updated_transaction AS (
     UPDATE transactions
     SET date = $1,
         recipient = $2,
         amount = $3
     WHERE id = $4
     RETURNING id, date, recipient, amount
   )
   SELECT
     t.id,
     TO_CHAR(t.date, 'YYYY-MM-DD') AS date,
     t.recipient,
     t.amount,
     c.classification
   FROM updated_transaction t
   LEFT JOIN classifications c
     ON LOWER(c.recipient) = LOWER(t.recipient)`,
        [date, recipient, amount, id],
      );
      if (queryResult.rows.length === 0) {
        return res.status(404).json({
          message: "Transaction not found",
        });
      }

      const parsed = transactionWithClassificationSchema.safeParse(
        queryResult.rows[0],
      );
      if (!parsed.success) {
        console.error(
          "Invalid transaction returned from database:",
          parsed.error,
        );

        return res.status(500).json({
          message: "Invalid transaction data returned from database",
        });
      }

      return res.status(200).json({
        message: "successfully updataed transtions",
        transtion: parsed.data,
      });
    } catch (_error: unknown) {
      return res.status(500).json({
        message: "Something went wrong with update request transtion",
      });
    }
  },
);
// delete transaction by ID

router.delete("/:id", validate(idParamsSchema, "params"), async (req, res) => {
  try {
    const id = Number(req.params.id);

    const queryResult = await pool.query(
      `WITH deleted_transaction AS (
     DELETE FROM transactions
     WHERE id = $1
     RETURNING id, date, recipient, amount
   )
   SELECT
     t.id,
     TO_CHAR(t.date, 'YYYY-MM-DD') AS date,
     t.recipient,
     t.amount,
     c.classification
   FROM deleted_transaction t
   LEFT JOIN classifications c
     ON LOWER(c.recipient) = LOWER(t.recipient)`,
      [id],
    );
    if (queryResult.rows.length === 0) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    const parsed = transactionWithClassificationSchema.safeParse(
      queryResult.rows[0],
    );

    if (!parsed.success) {
      console.error("Invalid deleted transaction data:", parsed.error);

      return res.status(500).json({
        message: "Invalid transaction data returned from database",
      });
    }

    return res.status(200).json({
      message: "Successfully deleted transaction",
      transaction: parsed.data,
    });
  } catch (error: unknown) {
    console.error("Invalid deleted transaction data:", error);
    return res.status(500).json({
      message: "Something went wrong with delete request transaction",
    });
  }
});

export default router;
