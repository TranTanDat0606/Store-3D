import { Response } from 'express';
import { contactService } from '../services/contactService';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';

export const contactController = {
  submit: asyncHandler(async (req, res: Response) => {
    const result = await contactService.submit(req.body);
    return successResponse(res, result, { message: result.message });
  }),
};
