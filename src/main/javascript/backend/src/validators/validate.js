import AppError from '../utils/AppError.js';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) throw new AppError('ERR_VALIDATION', result.error.errors[0].message, 400);
  req.validated = result.data;
  next();
};
