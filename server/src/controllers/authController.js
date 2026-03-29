import Joi from 'joi';
import * as authService from '../services/authService.js';
import { ValidationError } from '../errors/AppError.js';

const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).required(),
  countryCode: Joi.string().length(2).uppercase().required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export async function signup(req, res, next) {
  try {
    const { error, value } = signupSchema.validate(req.body);
    if (error) throw new ValidationError(error.message);
    const result = await authService.signup(value);
    res.status(201).json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
}

export async function login(req, res, next) {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) throw new ValidationError(error.message);
    const result = await authService.login(value);
    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
}

export async function me(req, res) {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      companyId: req.user.companyId,
      preferredCurrency: req.user.preferredCurrency,
    },
  });
}
