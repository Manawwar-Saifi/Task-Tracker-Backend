import express from "express";

const router = express.Router();

/**
 * Temporary test route
 * Remove later when real APIs are added
 */
router.get("/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "User module is working 🚀",
  });
});

export default router;
