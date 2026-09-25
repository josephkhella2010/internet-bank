# Internet Bank
A small internet-bank application for a single savings account, built as a REST API with a terminal client on top of it.

- **API**: Express + TypeScript, serving JSON over HTTP.
- **Client**: a terminal (CLI) app built with `@inquirer/prompts` that talks to the API exclusively over HTTP — it never touches the data files directly.
- **Data**: two JSON files act as simulated external services — one holding the transactions, one mapping recipients to spending categories.
- **Feature**: every outgoing payment is automatically classified into a spending category (Household, Transport, Food, Entertainment, or Unknown) based on who it was paid to.

## Requirements

* Node.js
* npm

## Run the project

Start the development server with:

```bash
npm run dev
```

The server will run on:

```text
http://localhost:3000
```

## Project Structure

```text
internet-bank/
├── data/
│   ├── classification.json
│   └── transaction.json
├── src/
│   ├── cli.ts
│   ├── data.ts
│   └── server.ts
├── package.json
└── README.md
```
## Data model

A transaction as stored on disk:

```ts
{ id: number; date: string; recipient: string; amount: number }
```

- `date` — calendar date as `YYYY-MM-DD`.
- `amount` — negative for money going out, positive for money coming in. Never `0`.

The API adds a derived `classification` field to every transaction it returns:

```json
{ "id": 1, "date": "2026-09-01", "recipient": "ICA", "amount": -350, "classification": "Food" }
```

Incoming transactions (`amount > 0`) always get `"classification": null` — shown as `—` in the CLI.

## API reference

Base URL: `http://localhost:3000` (or whatever `PORT`/`API_URL` you set).

All request and response bodies are JSON. Errors are always shaped as:

```json
{ "error": "a human-readable message" }
```

| Method | Path | Description |
| --- | --- | --- |
| GET | `/transactions` | List transactions, optionally filtered by date (`?from=YYYY-MM-DD&to=YYYY-MM-DD`) |
| GET | `/transactions/:id` | Get a single transaction |
| POST | `/transactions` | Create a transaction |
| PUT | `/transactions/:id` | Update a transaction (partial update) |
| DELETE | `/transactions/:id` | Delete a transaction |
| GET | `/classifications` | List the possible classification categories |

### `GET /transactions`

Returns all transactions, sorted by date, each with a `classification`.

Query parameters (both optional, both **inclusive**):

- `from=YYYY-MM-DD` — only transactions on or after this date
- `to=YYYY-MM-DD` — only transactions on or before this date

Behavior:
- An invalid date format, or a date that isn't real (e.g. `2026-13-40`) → `400`.
- `from` later than `to` → `400`.
- A valid range with no matching transactions → `200` with `[]`.

### `GET /transactions/:id`

Returns one transaction. `404` if no transaction has that id. `400` if `:id` isn't a whole number.

### `POST /transactions`

Body — all three fields required:

```json
{ "date": "2026-09-20", "recipient": "ICA", "amount": -250 }
```

- `date` — required, must be a real date as `YYYY-MM-DD`.
- `recipient` — required, non-empty string (leading/trailing whitespace is trimmed).
- `amount` — required, a number that isn't `0`.
- `id` — assigned by the server; do not send one.

Returns `201` with the created transaction (including its new `id` and derived `classification`). Returns `400` with a message describing every invalid/missing field if validation fails.

### `PUT /transactions/:id`

Partial update — send only the fields you want to change; at least one is required.

```json
{ "amount": -300 }
```

- Same validation rules as `POST` apply to any field that is sent.
- Fields you don't send keep their current value.
- The `id` can never be changed.
- Classification isn't stored — it's recalculated from the (possibly updated) recipient and amount every time the transaction is returned. So renaming the recipient re-classifies it, and flipping an outgoing transaction to incoming clears its classification.

Returns `200` with the updated transaction. `404` if the id doesn't exist, `400` for invalid id/body.

### `DELETE /transactions/:id`

Deletes the transaction and returns `200` (not `204`) with a confirmation message, so the CLI has something to display:

```json
{ "message": "Transaction 7 deleted." }
```

`404` if the id doesn't exist, `400` if `:id` isn't a whole number.

### `GET /classifications`

Returns the fixed list of possible categories:

```json
["Household", "Transport", "Food", "Entertainment", "Unknown"]
```


### HTTP status codes

| Code | Meaning |
| --- | --- |
| 200 | Successful GET, PUT, or DELETE |
| 201 | Transaction created |
| 400 | Invalid input: bad id, bad/missing fields, bad dates, malformed JSON body |
| 404 | Transaction not found, or unknown route |
| 500 | Unexpected server error |

## How classification works

1. Only **outgoing** transactions (`amount < 0`) get classified; incoming ones always get `null`.
2. The transaction's `recipient` is looked up in `data/classifications.json`, case-insensitively.
3. A match returns that category; no match returns `"Unknown"`.
4. The result is computed on every read, not stored on the transaction — so it always reflects the transaction's current recipient and amount, even right after an update.

To add or change recipient categories, edit `data/classifications.json`:

```json
{ "recipient": "ICA", "classification": "Food" }
```

## Using the CLI

Run `npm run cli` (with the API already running) to get an interactive menu, navigated with the arrow keys and Enter:

| Option | What it does |
| --- | --- |
| View transactions | Lists all transactions in a table |
| View one transaction | Prompts for an id, shows its full details |
| Add transaction | Prompts for date, recipient, and amount, then creates it |
| Update transaction | Prompts for an id, then walks through each field pre-filled with its current value — press Enter to keep it |
| Delete transaction | Prompts for an id, shows the transaction, asks for confirmation before deleting |
| Filter transactions by date | Prompts for a `from` and `to` date (either can be left blank), then lists matches |
| Exit | Quits the app |

Input is validated as you type (dates, non-empty recipient, non-zero numeric amount), and any error returned by the API is printed. Ctrl+C exits cleanly from anywhere in the menu.

## Storage and resetting data

Transactions live in memory while the server runs and are written back to `data/transactions.json` after every create, update, and delete, so changes persist across restarts.

To wipe your changes and restore the sample data (if this project is in a git repository):

```bash
git checkout data/transactions.json
```
