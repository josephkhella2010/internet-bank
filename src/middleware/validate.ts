import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

// Validation middleware
// checks req.body, req.params or req.query with a zod schema
// if something is wrong we send 400 and tell what field is wrong

type RequestPart = "body" | "params" | "query";

export function validate(schema: ZodType, part: RequestPart) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      const messages = errors.map((error) => error.message);

      return res.status(400).json({
        message: "Invalid input: " + messages.join(", "),
        errors: errors,
      });
    }

    // save the cleaned data (for example trimmed recipient)
    if (part === "body") {
      req.body = result.data;
    }

    next();
  };
}
