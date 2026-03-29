import Joi from 'joi';
import * as userService from '../services/userService.js';
import { ValidationError } from '../errors/AppError.js';

const createSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().required(),
  role: Joi.string().valid('employee', 'manager').required(),
  managerId: Joi.string().allow(null),
  countryCode: Joi.string().length(2),
  preferredCurrency: Joi.string().length(3),
});

const updateSchema = Joi.object({
  name: Joi.string(),
  role: Joi.string().valid('employee', 'manager', 'admin'),
  managerId: Joi.string().allow(null),
  preferredCurrency: Joi.string().length(3),
});

export async function list(req, res, next) {
  try {
    const users = await userService.listUsers(req.user);
    res.json({ success: true, users });
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) throw new ValidationError(error.message);
    const user = await userService.createUser(req.user, value);
    res.status(201).json({ success: true, user });
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const { error, value } = updateSchema.validate(req.body);
    if (error) throw new ValidationError(error.message);
    const user = await userService.updateUser(req.user, req.params.id, value);
    res.json({ success: true, user });
  } catch (e) {
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    await userService.deleteUser(req.user, req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (e) {
    next(e);
  }
}
