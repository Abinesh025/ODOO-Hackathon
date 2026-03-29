import Joi from 'joi';
import * as flowService from '../services/approvalFlowService.js';
import { ValidationError } from '../errors/AppError.js';

const stepSchema = Joi.object({
  order: Joi.number(),
  label: Joi.string().required(),
  stepType: Joi.string().valid('manager', 'user').required(),
  approverUserId: Joi.string().allow(null),
});

const upsertSchema = Joi.object({
  name: Joi.string(),
  steps: Joi.array().items(stepSchema).default([]),
});

export async function get(req, res, next) {
  try {
    const flow = await flowService.getFlow(req.user);
    res.json({ success: true, flow });
  } catch (e) {
    next(e);
  }
}

export async function upsert(req, res, next) {
  try {
    const { error, value } = upsertSchema.validate(req.body);
    if (error) throw new ValidationError(error.message);
    const flow = await flowService.upsertFlow(req.user, value);
    res.json({ success: true, flow });
  } catch (e) {
    next(e);
  }
}
