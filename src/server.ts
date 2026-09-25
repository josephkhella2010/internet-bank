import express from "express";
import { z } from "zod";
import dotenv from "dotenv";
import { classifications, transaction } from "./data.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

let transactions = transaction;

// Zod schemas

// transationSchema

const transactionSchema = z.object({
  id: z.number(),
  date: z.string(),
  recipient: z.string().min(1),
  amount: z.number(),
});

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

app.get("/transactions", (req, res) => {
  try {
    const result = transactionsSchema.safeParse(transactions);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid transaction data",
        error: result.error,
      });
    }

    return res.status(200).json({
      message: "successfully get all transtions",
      translations: result.data,
    });
  } catch (error: unknown) {
    return res.status(500).json({
      message: "Something went wrong with get all transtions",
    });
  }
});

// Get transaction by ID

app.get("/transactions/:id", (req, res) => {
  try {
    const id = Number(req.params.id);

    const findId = transactions.find((tra) => Number(tra.id) === id);

    const result = transactionSchema.safeParse(findId);
    const results = transactionsSchema.safeParse(transactions);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid transaction data",
        error: result.error,
      });
    }

    return res.status(200).json({
      message: "successfully get transtion",
      transtion: result.data,
      transtions: results.data,
    });
  } catch (error: unknown) {
    return res.status(500).json({
      message: "Something went wrong with get transtion",
    });
  }
});

// post transaction by ID

app.post("/transactions/", (req, res) => {
  try {
    const result = createTransactionSchema.safeParse(req.body);
    const results = transactionsSchema.safeParse(transactions);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid transaction data",
        error: result.error,
      });
    }
    const newTransaction = {
      ...result.data,
      id: transactions.length + 1,
    };
    transactions.push(newTransaction);

    return res.status(201).json({
      message: "successfully added transtions",
      transtion: newTransaction,
      transtions: results.data,
    });
  } catch (error: unknown) {
    return res.status(500).json({
      message: "Something went wrong with post request transtion",
    });
  }
});
//  update put transaction by ID

app.put("/transactions/:id", (req, res) => {
  try {
    const fields = createTransactionSchema.safeParse(req.body);
    const id = Number(req.params.id);

    const findIndex = transactions.findIndex((tra) => Number(tra.id) === id);

    if (findIndex === -1) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }
    if (!fields.success) {
      return res.status(400).json({
        message: "Invalid transaction data",
        error: fields.error,
      });
    }
    transactions[findIndex] = {
      id: transactions[findIndex]!.id,
      date: fields.data.date,
      recipient: fields.data.recipient,
      amount: fields.data.amount,
    };
    const result = createTransactionSchema.safeParse(transactions[findIndex]);

    const results = transactionsSchema.safeParse(transactions);

    return res.status(200).json({
      message: "successfully updataed transtions",
      transtion: result.data,
      transtions: results.data,
    });
  } catch (error: unknown) {
    return res.status(500).json({
      message: "Something went wrong with update request transtion",
    });
  }
});
// delete transaction by ID

app.delete("/transactions/:id", (req, res) => {
  try {
    const id = Number(req.params.id);

    const findId = transactions.find((tra) => Number(tra.id) === id);

    if (!findId) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    const result = transactionSchema.safeParse(findId);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid transaction data",
        error: result.error,
      });
    }

    const filteredTranstion = transactions.filter(
      (tra) => Number(tra.id) !== id,
    );

    transactions = filteredTranstion;

    return res.status(200).json({
      message: "successfully deleted transaction",
      transaction: result.data,
      transactions: transactions,
    });
  } catch (error: unknown) {
    return res.status(500).json({
      message: "Something went wrong with delete request transaction",
    });
  }
});

// Get all classifications

app.get("/classifications", (req, res) => {
  try {
    const result = classificationsSchema.safeParse(classifications);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid classification data",
        transtions: result.data,
      });
    }

    return res.status(200).json(result.data);
  } catch (error: unknown) {
    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});

// Filter transactions by date

app.get("/filter", (req, res) => {
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

    const filteredTransactions = transactions.filter((tra) => {
      return tra.date >= from && tra.date <= to;
    });

    console.log("Filtered:", filteredTransactions);

    return res.status(200).json({
      message: "Successfully filtered transactions",
      transactions: filteredTransactions,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong while filtering transactions",
    });
  }
});

// Start server

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
