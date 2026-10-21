# Internet Bank

A small internet-bank application for a single savings account, built as a REST API with a terminal client.

- **API:** Express and TypeScript, serving JSON over HTTP.
- **Client:** A terminal application built with `@inquirer/prompts` that communicates with the API over HTTP.
- **Database:** PostgreSQL stores transactions and application data.
- **Classification:** Outgoing payments are classified into Household, Transport, Food, Entertainment, or Unknown based on the recipient.

## Requirements

- Node.js and npm
- Docker Desktop with Docker Compose

## Environment configuration

Create a `.env` file in the project root. Configure the variables required by `compose.yml` and the application:

- `API_PORT` — port used by the API.
- `API_URL` — API address used by the CLI. It must match the API host and port.
- `DB_PORT` — host port exposed by the PostgreSQL Docker container.
- `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` — database connection settings.
- `PGADMIN_EMAIL`, `PGADMIN_PASSWORD`, and `PGADMIN_PORT` — pgAdmin settings.

Keep `.env` private. Do not commit passwords or other secrets to Git.

When the API runs directly on your computer, `POSTGRES_HOST` should normally be `localhost`, and `POSTGRES_PORT` must match the host port configured by `DB_PORT`.

## Run the project

Run these commands from the project root.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start PostgreSQL and pgAdmin:

   ```bash
   docker compose up -d
   ```

3. Start the API in one terminal:

   ```bash
   npm run dev
   ```

4. Start the CLI in a second terminal:

   ```bash
   npm run cli
   ```

5. Check the code when needed:

   ```bash
   npm run typecheck
   npm run lint
   ```

The API address is determined by `API_PORT` in `.env`. Ensure `API_URL` points to the same address so the CLI can connect.

To stop the Docker services, run:

```bash
docker compose down
```

This stops the containers but normally keeps data in the named Docker volumes.

## Project decisions

- **PostgreSQL:** Transactions are stored in a relational database rather than JSON files.
- **Docker Compose:** Provides PostgreSQL and pgAdmin for local development.
- **Separation of concerns:** The Express API handles HTTP requests, while the CLI communicates with it over HTTP instead of accessing the database directly.
- **Input validation:** Zod schemas validate user input before it is processed.
- **SQL injection prevention:** Parameterized SQL queries are used for user-provided values.
- **Code quality:** TypeScript type checking and ESLint help identify errors and maintain consistent code.
- **Configuration:** Environment variables keep application and database settings outside the source code.

## Project structure

```text
internet-bank/
├── .github/             # GitHub workflows and project settings
├── db/                  # SQL initialization scripts
├── src/
│   ├── middleware/      # Request validation and error handling
│   ├── routes/          # API route handlers
│   ├── cli.ts           # Terminal client
│   ├── db.ts            # PostgreSQL connection pool
│   ├── env.ts           # Environment configuration
│   ├── schemas.ts       # Validation schemas
│   └── server.ts        # Express API server
├── tests/               # Tests
├── compose.yml          # PostgreSQL and pgAdmin services
├── eslint.config.js     # ESLint configuration
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

## Data model

A transaction contains the following fields:

```ts
{
  id: number;
  date: string;
  recipient: string;
  amount: number;
}
```

- `id` — unique transaction identifier.
- `date` — transaction date in `YYYY-MM-DD` format.
- `recipient` — the person, company, or organization involved in the transaction.
- `amount` — negative for money going out and positive for money coming in. Zero is not allowed.

The API adds a derived `classification` field to transactions returned to the client. For example:

```json
{
  "id": 1,
  "date": "2026-09-01",
  "recipient": "ICA",
  "amount": -350,
  "classification": "Food"
}
```

Incoming transactions (`amount > 0`) have a `classification` value of `null`, displayed as `—` in the CLI.

The classification is calculated by the application and is not part of the transaction fields shown above.

## API reference

Base URL:

```text
http://localhost:<API_PORT>
```

Replace `<API_PORT>` with the value configured in `.env`.

All request and response bodies use JSON. Errors generally use the following format:

```json
{
  "error": "A human-readable message"
}
```

### Endpoints

| Method | Path                | Description                                    |
| ------ | ------------------- | ---------------------------------------------- |
| GET    | `/transactions`     | List transactions, optionally filtered by date |
| GET    | `/transactions/:id` | Get a single transaction                       |
| POST   | `/transactions`     | Create a transaction                           |
| PUT    | `/transactions/:id` | Partially update a transaction                 |
| DELETE | `/transactions/:id` | Delete a transaction                           |
| GET    | `/classifications`  | List possible classification categories        |

The API also includes filtering and spending routes under `/filter` and `/spending`.

### `GET /transactions`

Returns transactions, with a derived classification for each transaction.

Optional query parameters:

- `from=YYYY-MM-DD` — include transactions on or after this date.
- `to=YYYY-MM-DD` — include transactions on or before this date.

The date boundaries are inclusive.

Expected validation behavior:

- Invalid or impossible dates return `400 Bad Request`.
- A start date later than the end date returns `400 Bad Request`.
- A valid date range with no matching transactions returns `200 OK` with an empty array.

### `GET /transactions/:id`

Returns one transaction.

- `200 OK` — transaction found.
- `400 Bad Request` — invalid transaction ID.
- `404 Not Found` — transaction does not exist.

### `POST /transactions`

Creates a transaction.

Example request body:

```json
{
  "date": "2026-09-20",
  "recipient": "ICA",
  "amount": -250
}
```

Required fields:

- `date` — a valid date in `YYYY-MM-DD` format.
- `recipient` — a non-empty string.
- `amount` — a number other than zero.

The server assigns the transaction ID. Do not provide an ID in the request body.

A successful creation returns `201 Created` with the created transaction, including its ID and derived classification. Invalid input returns `400 Bad Request`.

### `PUT /transactions/:id`

Updates an existing transaction. Only the fields to change need to be provided, and at least one field must be included.

Example request body:

```json
{
  "amount": -300
}
```

The same validation rules as creation apply to any supplied fields. Fields not included in the request retain their existing values, and the transaction ID cannot be changed.

Classification is recalculated using the updated transaction data. Changing the recipient may change the classification, and changing an outgoing transaction to an incoming transaction makes its classification `null`.

A successful update returns `200 OK`. An invalid ID or request body returns `400 Bad Request`; a missing transaction returns `404 Not Found`.

### `DELETE /transactions/:id`

Deletes a transaction.

A successful deletion returns `200 OK` with a confirmation message, for example:

```json
{
  "message": "Transaction 7 deleted."
}
```

An invalid ID returns `400 Bad Request`. A transaction that does not exist returns `404 Not Found`.

### `GET /classifications`

Returns the possible classification categories:

```json
["Household", "Transport", "Food", "Entertainment", "Unknown"]
```

### HTTP status codes

| Code  | Meaning                            |
| ----- | ---------------------------------- |
| `200` | Successful request                 |
| `201` | Transaction created                |
| `400` | Invalid input or malformed request |
| `404` | Transaction or route not found     |
| `500` | Unexpected server error            |

## How classification works

1. Only outgoing transactions (`amount < 0`) are classified.
2. Incoming transactions (`amount > 0`) have a classification of `null`.
3. Outgoing transactions are assigned one of the supported categories: Household, Transport, Food, Entertainment, or Unknown.
4. If no recipient category matches, the transaction receives the `Unknown` classification.
5. The classification is calculated when the transaction is returned, rather than stored as part of the transaction itself.

Classification data and lookup rules are managed by the application's current implementation and database configuration, not by the old JSON files.

## Using the CLI

Start the API first, then run:

```bash
npm run cli
```

The CLI provides an interactive terminal menu navigated with the arrow keys and Enter.

| Option                      | What it does                                   |
| --------------------------- | ---------------------------------------------- |
| View transactions           | Lists transactions in a table                  |
| View one transaction        | Prompts for an ID and displays its details     |
| Add transaction             | Prompts for a date, recipient, and amount      |
| Update transaction          | Prompts for an ID and the fields to update     |
| Delete transaction          | Prompts for an ID and confirms before deleting |
| Filter transactions by date | Filters transactions using a date range        |
| Exit                        | Quits the application                          |

The CLI sends requests to the API over HTTP. It does not access the database directly.

Input validation helps prevent invalid dates, empty recipients, and zero or non-numeric amounts from being submitted. API errors are displayed in the terminal.

## Database storage and resetting data

PostgreSQL is used to store application data. Docker Compose creates a PostgreSQL service and persists database files in the named `pgdata` volume.

The `db/` directory contains SQL initialization scripts mounted into the PostgreSQL container when it is first initialized.

Stopping the services with:

```bash
docker compose down
```

does not normally delete the database volume.

**Warning:** Removing the database volume deletes the data stored in it. Only do this if you intentionally want to reset the local database.

```bash
docker compose down --volumes
docker compose up -d
```

This removes the Compose-managed volumes before recreating the services. Make sure you do not need any existing local database data before running these commands.

## Security check: SQL injection

- **Code review:** Reviewed `src/routes/transactions.ts`, `src/routes/filter.ts`, and `src/routes/spending.ts` for SQL queries that concatenate user input.
- **Protection:** Parameterized SQL queries are used for user-provided values in the reviewed queries.
- **Test:** Sent a suspicious transaction ID to the API using `GET /transactions/1%20OR%201%3D1`.
- **Result:** The API returned `400 Bad Request` with the message `Id must be a number`.
- **Conclusion:** The invalid ID was rejected before it could be treated as a valid transaction ID. Parameterized SQL queries provide additional protection for user-provided values used in database queries.
