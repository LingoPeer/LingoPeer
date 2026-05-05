import { validationResult } from 'express-validator';

/**
 * Run after express-validator chains on the same route.
 */
export function handleValidationErrors(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.array({ onlyFirstError: true }),
    });
  }
  next();
}
