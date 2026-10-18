import express from "express";
import { classificationEnum } from "../schemas.ts";

const router = express.Router();

// Get all classifications (from the zod enum)

router.get("/", (req, res) => {
  return res.status(200).json({
    message: "Successfully retrieved classifications",
    classifications: classificationEnum.options,
  });
});

export default router;
