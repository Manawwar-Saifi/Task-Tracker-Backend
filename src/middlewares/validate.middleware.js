import { ZodError } from "zod";
import AppError from "../utils/AppError.js";

/**
 * Validate middleware using Zod schemas
 * @param {import('zod').ZodSchema} schema - Zod validation schema
 */
const validate = (schema) => {
  return async (req, res, next) => {
    try {
      // Validate request data
      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Replace request data with validated data
      req.body = validated.body || req.body;
      req.query = validated.query || req.query;
      req.params = validated.params || req.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors
        const errors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }

      // Pass other errors to error handler
      next(new AppError("Validation error", 400));
    }
  };
};

export default validate;
