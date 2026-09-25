import { select, input, confirm } from "@inquirer/prompts";

const API_URL = "http://localhost:3304";

// Types

type Transaction = {
  id: number;
  date: string;
  recipient: string;
  amount: number;
};

type ApiResponse = {
  message?: string;
  transactions?: Transaction[];
  transaction?: Transaction;

  translations?: Transaction[];
  transtion?: Transaction;
};

// Helper: Check Date

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parts = value.split("-");

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

// 1. View All Transactions api

async function viewAllTransactions(): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/transactions`);

    const data: ApiResponse = await response.json();

    if (!response.ok) {
      console.log(`\n❌ ${data.message ?? "Something went wrong"}\n`);
      return;
    }

    const transactions = data.transactions ?? data.translations ?? [];

    if (transactions.length === 0) {
      console.log("\nNo transactions found.\n");
      return;
    }

    console.log("\n=== All Transactions ===\n");

    console.table(transactions);
  } catch {
    console.log("\n❌ Could not connect to the API.");
    console.log("Make sure your Express server is running.\n");
  }
}

// 2. View One Transaction

async function viewOneTransaction(): Promise<void> {
  const id = await input({
    message: "Enter transaction ID:",

    validate(value) {
      if (!value.trim()) {
        return "ID is required";
      }

      if (!Number.isInteger(Number(value))) {
        return "ID must be a number";
      }

      return true;
    },
  });

  try {
    const response = await fetch(`${API_URL}/transactions/${id}`);

    const data: ApiResponse = await response.json();

    if (!response.ok) {
      console.log(`\n❌ ${data.message ?? "Transaction not found"}\n`);
      return;
    }

    const transaction = data.transaction ?? data.transtion;

    if (!transaction) {
      console.log("\n❌ Transaction not found.\n");
      return;
    }

    console.log("\n=== Transaction ===\n");

    console.table([transaction]);
  } catch {
    console.log("\n❌ Could not connect to the API.");
    console.log("Make sure your Express server is running.\n");
  }
}

// 3. Add Transaction

async function addTransaction(): Promise<void> {
  console.log("\n=== Add Transaction ===\n");

  const date = await input({
    message: "Date (YYYY-MM-DD):",

    validate(value) {
      if (!value.trim()) {
        return "Date is required";
      }

      if (!isValidDate(value)) {
        return "Please enter a valid date in YYYY-MM-DD format";
      }

      return true;
    },
  });

  const recipient = await input({
    message: "Recipient:",

    validate(value) {
      if (!value.trim()) {
        return "Recipient is required";
      }

      return true;
    },
  });

  const amountString = await input({
    message: "Amount:",

    validate(value) {
      if (!value.trim()) {
        return "Amount is required";
      }

      if (Number.isNaN(Number(value))) {
        return "Amount must be a number";
      }

      return true;
    },
  });

  const amount = Number(amountString);

  try {
    const response = await fetch(`${API_URL}/transactions`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        date,
        recipient,
        amount,
      }),
    });

    const data: ApiResponse = await response.json();

    if (!response.ok) {
      console.log(`\n❌ ${data.message ?? "Could not create transaction"}\n`);

      return;
    }

    const transaction = data.transaction ?? data.transtion;

    console.log("\n✅ Transaction created successfully!\n");

    if (transaction) {
      console.table([transaction]);
    }
  } catch {
    console.log("\n❌ Could not connect to the API.");
    console.log("Make sure your Express server is running.\n");
  }
}

// 4. Update Transaction

async function updateTransaction(): Promise<void> {
  console.log("\n=== Update Transaction ===\n");

  const id = await input({
    message: "Transaction ID:",

    validate(value) {
      if (!value.trim()) {
        return "ID is required";
      }

      if (!Number.isInteger(Number(value))) {
        return "ID must be a number";
      }

      return true;
    },
  });

  const date = await input({
    message: "New date (YYYY-MM-DD):",

    validate(value) {
      if (!value.trim()) {
        return "Date is required";
      }

      if (!isValidDate(value)) {
        return "Please enter a valid date in YYYY-MM-DD format";
      }

      return true;
    },
  });

  const recipient = await input({
    message: "New recipient:",

    validate(value) {
      if (!value.trim()) {
        return "Recipient is required";
      }

      return true;
    },
  });

  const amountString = await input({
    message: "New amount:",

    validate(value) {
      if (!value.trim()) {
        return "Amount is required";
      }

      if (Number.isNaN(Number(value))) {
        return "Amount must be a number";
      }

      return true;
    },
  });

  const amount = Number(amountString);

  try {
    const response = await fetch(`${API_URL}/transactions/${id}`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        date,
        recipient,
        amount,
      }),
    });

    const data: ApiResponse = await response.json();

    if (!response.ok) {
      console.log(`\n❌ ${data.message ?? "Could not update transaction"}\n`);

      return;
    }

    const transaction = data.transaction ?? data.transtion;

    console.log("\n✅ Transaction updated successfully!\n");

    if (transaction) {
      console.table([transaction]);
    }
  } catch {
    console.log("\n❌ Could not connect to the API.");
    console.log("Make sure your Express server is running.\n");
  }
}

// 5. Delete Transaction

async function deleteTransaction(): Promise<void> {
  console.log("\n=== Delete Transaction ===\n");

  const id = await input({
    message: "Transaction ID:",

    validate(value) {
      if (!value.trim()) {
        return "ID is required";
      }

      if (!Number.isInteger(Number(value))) {
        return "ID must be a number";
      }

      return true;
    },
  });

  const confirmed = await confirm({
    message: `Are you sure you want to delete transaction ${id}?`,
    default: false,
  });

  if (!confirmed) {
    console.log("\nDelete cancelled.\n");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/transactions/${id}`, {
      method: "DELETE",
    });

    const data: ApiResponse = await response.json();

    if (!response.ok) {
      console.log(`\n❌ ${data.message ?? "Could not delete transaction"}\n`);

      return;
    }

    console.log("\n✅ Transaction deleted successfully!\n");
  } catch {
    console.log("\n❌ Could not connect to the API.");
    console.log("Make sure your Express server is running.\n");
  }
}

// 6. Filter Transactions

async function filterTransactions(): Promise<void> {
  console.log("\n=== Filter Transactions ===\n");

  const from = await input({
    message: "From date (YYYY-MM-DD):",
    validate(value) {
      if (!value.trim()) {
        return "Start date is required";
      }

      if (!isValidDate(value)) {
        return "Please enter a valid date in YYYY-MM-DD format";
      }

      return true;
    },
  });

  const to = await input({
    message: "To date (YYYY-MM-DD):",
    validate(value) {
      if (!value.trim()) {
        return "End date is required";
      }

      if (!isValidDate(value)) {
        return "Please enter a valid date in YYYY-MM-DD format";
      }

      if (value < from) {
        return "End date cannot be before start date";
      }

      return true;
    },
  });

  try {
    const url =
      `${API_URL}/filter` +
      `?from=${encodeURIComponent(from)}` +
      `&to=${encodeURIComponent(to)}`;

    console.log("Request:", url);

    const response = await fetch(url);

    const data: ApiResponse = await response.json();

    console.log("API response:", data);

    if (!response.ok) {
      console.log(`\n❌ ${data.message ?? "Could not filter transactions"}\n`);
      return;
    }

    const transactions = data.transactions ?? [];

    console.log(`\n=== Transactions from ${from} to ${to} ===\n`);

    if (transactions.length === 0) {
      console.log("No transactions found in this date range.\n");
      return;
    }

    console.table(transactions);
  } catch (error) {
    console.log("\n❌ Could not connect to the API.");
    console.log("Make sure your Express server is running.\n");
  }
}
// 7. Main Menu

async function main(): Promise<void> {
  console.clear();

  console.log("=================================");
  console.log("       INTERNET BANK APP");
  console.log("=================================\n");

  while (true) {
    try {
      const choice = await select({
        message: "What would you like to do?",

        choices: [
          {
            name: "View all transactions",
            value: "view-all",
          },

          {
            name: "View one transaction",
            value: "view-one",
          },

          {
            name: "Add transaction",
            value: "add",
          },

          {
            name: "Update transaction",
            value: "update",
          },

          {
            name: "Delete transaction",
            value: "delete",
          },

          {
            name: "Filter transactions by date",
            value: "filter",
          },

          {
            name: "Exit",
            value: "exit",
          },
        ],
      });

      switch (choice) {
        case "view-all":
          await viewAllTransactions();
          break;

        case "view-one":
          await viewOneTransaction();
          break;

        case "add":
          await addTransaction();
          break;

        case "update":
          await updateTransaction();
          break;

        case "delete":
          await deleteTransaction();
          break;

        case "filter":
          await filterTransactions();
          break;

        case "exit":
          console.log("\nThank you for using Internet Bank. Goodbye! 👋\n");

          return;
      }

      await input({
        message: "Press Enter to return to the main menu...",
      });

      console.clear();

      console.log("=================================");
      console.log("       INTERNET BANK APP");
      console.log("=================================\n");
    } catch {
      console.log("\nOperation cancelled.\n");
    }
  }
}

// Start CLI

main().catch((error) => {
  console.error("Application error:", error);
});
