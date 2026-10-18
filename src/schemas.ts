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

export const createTransactionSchema = z.object({
  date: z.string(),
  recipient: z.string().min(1),
  amount: z.number(),
});

// classification schema

export const classificationSchema = z.object({
  recipient: z.string().min(1),
  classification: z.string().min(1),
});

export const classificationsSchema = z.array(classificationSchema);
