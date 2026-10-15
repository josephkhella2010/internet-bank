import express from "express";
import { z } from "zod";
import dotenv from "dotenv";
import pool from "./db.ts";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Zod schemas

// transationSchema

const transactionSchema = z.object({
  id: z.number(),
  date: z.iso.date(),
  recipient: z.string().min(1),
  amount: z.number(),
});
const transactionWithClassificationSchema = transactionSchema.extend({
  classification: z.string().nullable(),
});

const transactionsWithClassificationSchema = z.array(
  transactionWithClassificationSchema,
);

const transactionsSchema = z.array(transactionSchema);

const createTransactionSchema = z.object({
  date: z.string(),
  recipient: z.string().min(1),
  amount: z.number(),
});

// classification schema

const classificationSchema = z.object({
  recipient: z.string().min(1),
  classification: z.string().min(1),
});

const classificationsSchema = z.array(classificationSchema);

// Get all transactions

app.get("/transactions", async (req, res) => {
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
  } catch (error: unknown) {
    return res.status(500).json({
      message: "Something went wrong with get all transtions",
    });
  }
});

// Get transaction by ID
app.get("/transactions/:id", async (req, res) => {
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
  } catch (error: unknown) {
    return res.status(500).json({
      message: "Something went wrong with get transtion",
    });
  }
});

// post transaction by ID

app.post("/transactions", async (req, res) => {
  try {
    const result = createTransactionSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid transaction data",
        error: result.error,
      });
    }
    const { date, recipient, amount } = result.data;

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
    console.error("Something went wrong with post request transaction:", error);

    return res.status(500).json({
      message: "Something went wrong with post request transtion",
    });
  }
});
//  update put transaction by ID

app.put("/transactions/:id", async (req, res) => {
  try {
    const fields = createTransactionSchema.safeParse(req.body);
    const id = Number(req.params.id);

    if (!fields.success) {
      return res.status(400).json({
        message: "Invalid transaction data",
        error: fields.error,
      });
    }
    const { date, recipient, amount } = fields.data;

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
  } catch (error: unknown) {
    return res.status(500).json({
      message: "Something went wrong with update request transtion",
    });
  }
});
// delete transaction by ID

app.delete("/transactions/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid transaction ID",
      });
    }

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

// Get all classifications

app.get("/classifications", async (req, res) => {
  try {
    const queryResult = await pool.query(
      "SELECT recipient, classification FROM classifications ORDER BY id",
    );
    const result = classificationsSchema.safeParse(queryResult.rows);

    if (!result.success) {
      return res.status(500).json({
        message: "Invalid classification data returned from database",
        error: result.error.flatten(),
      });
    }

    return res.status(200).json({
      message: "Successfully retrieved classifications",
      classifications: result.data,
    });
  } catch (error: unknown) {
    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});

// Filter transactions by date

app.get("/filter", async (req, res) => {
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

app.get("/spending", async (req, res) => {
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

// Start server

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
