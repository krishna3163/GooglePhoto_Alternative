import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppErrorPayload {
  code: string;
  message: string;
  details?: any;
}

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(statusCode: number, code: string, message: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const errorDetails = err.issues.map((i) => i.message).join(', ');
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: errorDetails || 'Invalid request parameters',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    });
    return;
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // Generic fallback without leaking stack traces or credentials
  console.error('Unhandled Server Error:', err?.message || err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err?.message || 'An unexpected internal error occurred. Please try again.',
    },
  });
}
