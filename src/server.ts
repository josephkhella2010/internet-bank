import express from "express";
import dotenv from "dotenv";
import transactionsRouter from "./routes/transactions.ts";
import classificationsRouter from "./routes/classifications.ts";
import filterRouter from "./routes/filter.ts";
import spendingRouter from "./routes/spending.ts";
import { jsonErrorHandler } from "./middleware/validate.ts";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Routes

app.use("/transactions", transactionsRouter);
app.use("/classifications", classificationsRouter);
app.use("/filter", filterRouter);
app.use("/spending", spendingRouter);

// handle broken json in the body
app.use(jsonErrorHandler);

// Start server

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
