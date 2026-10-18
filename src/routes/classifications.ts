import express from "express";
import pool from "../db.ts";
import { classificationsSchema } from "../schemas.ts";

const router = express.Router();

// Get all classifications

router.get("/", async (req, res) => {
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

export default router;
