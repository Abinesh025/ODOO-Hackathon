import Joi from 'joi';
import * as companyService from '../services/companyService.js';
import { ValidationError } from '../errors/AppError.js';

const updateSchema = Joi.object({
  name: Joi.string(),
  defaultCurrency: Joi.string().length(3),
  isManagerApproverFirst: Joi.boolean(),
});

export async function get(req, res, next) {
  try {
    const company = await companyService.getCompany(req.user);
    res.json({ success: true, company });
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const { error, value } = updateSchema.validate(req.body);
    if (error) throw new ValidationError(error.message);
    const company = await companyService.updateCompany(req.user, value);
    res.json({ success: true, company });
  } catch (e) {
    next(e);
  }
}
