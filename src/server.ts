import express from "express";
import { z } from "zod";
import dotenv from "dotenv";
import { transactions, classifications } from "./data.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Zod schemas

const transactionSchema = z.object({
  id: z.number(),
  date: z.string(),
  recipient: z.string().min(1),
  amount: z.number(),
});

const transactionsSchema = z.array(transactionSchema);

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
      });
    }

    return res.status(200).json(result.data);
  } catch (error: unknown) {
    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});

// Get transaction by ID

app.get("/transactions/:id", (req, res) => {
  try {
    const id = Number(req.params.id);

    const findId = transactions.find((tra) => Number(tra.id) === id);

    const result = transactionSchema.safeParse(findId);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid transaction data",
      });
    }

    return res.status(200).json(result.data);
  } catch (error: unknown) {
    return res.status(500).json({
      message: "Something went wrong",
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
      });
    }

    return res.status(200).json(result.data);
  } catch (error: unknown) {
    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});

// Start server

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
