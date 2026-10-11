import { Request, Response, NextFunction } from 'express';
import { AppError, sendError } from '../utils/apiResponse.util';
import { HTTP_STATUS } from '../constants';

export const globalErrorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    sendError(res, err.message, err.errors, err.statusCode);
    return;
  }

  // Handle Mongoose schema validation errors -> 400 Bad Request
  if (typeof err === 'object' && err !== null && (err as { name?: string }).name === 'ValidationError') {
    const fieldErrors = (err as { errors?: Record<string, { message: string }> }).errors;
    const messages = fieldErrors ? Object.values(fieldErrors).map((e) => e.message) : undefined;
    sendError(
      res,
      'Validation failed for the submitted data.',
      messages && messages.length ? messages : undefined,
      HTTP_STATUS.BAD_REQUEST
    );
    return;
  }

  // Handle malformed identifiers (e.g. invalid Mongo ObjectId in a route param) -> 400
  if (typeof err === 'object' && err !== null && (err as { name?: string }).name === 'CastError') {
    const castErr = err as { path?: string };
    sendError(
      res,
      `Invalid value provided for '${castErr.path ?? 'field'}'.`,
      undefined,
      HTTP_STATUS.BAD_REQUEST
    );
    return;
  }

  // Handle MongoDB duplicate key error (code 11000)
  if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 11000) {
    const keyPattern = (err as { keyPattern?: Record<string, unknown> }).keyPattern;
    const duplicatedField = keyPattern ? Object.keys(keyPattern)[0] : 'field';
    sendError(
      res,
      `A record with this ${duplicatedField} already exists in the system.`,
      [`Duplicate value entered for ${duplicatedField}`],
      HTTP_STATUS.CONFLICT
    );
    return;
  }

  // Handle generic error
  const errorMessage = err instanceof Error ? err.message : 'An unexpected server error occurred';
  console.error('[GlobalErrorHandler] Unhandled Exception:', err);

  sendError(
    res,
    process.env.NODE_ENV === 'production' ? 'An internal error occurred. Please try again later.' : errorMessage,
    undefined,
    HTTP_STATUS.INTERNAL_SERVER_ERROR
  );
};
