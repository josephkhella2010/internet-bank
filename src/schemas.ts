import { z } from "zod";

// Zod schemas

// transationSchema

export const transactionSchema = z.object({
  id: z.number(),
  date: z.iso.date(),
  recipient: z.string().min(1),
  amount: z.number(),
});
export const transactionWithClassificationSchema = transactionSchema.extend({
  classification: z.string().nullable(),
});

export const transactionsWithClassificationSchema = z.array(
  transactionWithClassificationSchema,
);

export const transactionsSchema = z.array(transactionSchema);

// date schema (used in body and in the date filter)

const dateSchema = z.iso.date({
  error: "Date must be a real date in YYYY-MM-DD format",
});

// body schema for post and put

export const createTransactionSchema = z.object({
  date: dateSchema,
  recipient: z
    .string({ error: "Recipient must be a text" })
    .trim()
    .min(1, "Recipient is required"),
  amount: z
    .number({ error: "Amount must be a number" })
    .refine((value) => value !== 0, { message: "Amount cannot be 0" }),
});

// params schema for /transactions/:id

export const idParamsSchema = z.object({
  id: z.coerce
    .number({ error: "Id must be a number" })
    .int("Id must be a whole number")
    .positive("Id must be bigger than 0"),
});

// query schema for the date filter (/filter?from=...&to=...)

export const dateFilterQuerySchema = z
  .object({
    from: dateSchema,
    to: dateSchema,
  })
  .refine((data) => data.from <= data.to, {
    message: "From date cannot be after to date",
    path: ["from"],
  });

// classification enum (all categories that exist)

export const classificationEnum = z.enum([
  "Household",
  "Transport",
  "Food",
  "Entertainment",
  "Unknown",
]);

// classification schema

export const classificationSchema = z.object({
  recipient: z.string().min(1),
  classification: z.string().min(1),
});

export const classificationsSchema = z.array(classificationSchema);
