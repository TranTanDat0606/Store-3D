import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../utils/AppError';

/**
 * Validates a request part (body/query/params) against a Zod schema.
 * On failure, throws a 400 AppError with meaningful Vietnamese messages.
 */
export function validateRequest(schema: ZodSchema, part: 'body' | 'query' | 'params' = 'body'): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      const messages = result.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`,
      );
      return next(new AppError(messages.join('; '), 400));
    }
    req[part] = result.data;
    next();
  };
}
