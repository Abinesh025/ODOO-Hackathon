import Joi from 'joi';
import * as ruleService from '../services/ruleService.js';
import { ValidationError } from '../errors/AppError.js';

const createSchema = Joi.object({
  name: Joi.string().required(),
  isActive: Joi.boolean(),
  ruleType: Joi.string().valid('percentage', 'specific_approver', 'hybrid').required(),
  percentageThreshold: Joi.number().min(0).max(100).allow(null),
  specificApproverId: Joi.string().allow(null),
  hybridOperator: Joi.string().valid('or', 'and'),
});

export async function list(req, res, next) {
  try {
    const rules = await ruleService.listRules(req.user);
    res.json({ success: true, rules });
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) throw new ValidationError(error.message);
    const rule = await ruleService.createRule(req.user, value);
    res.status(201).json({ success: true, rule });
  } catch (e) {
    next(e);
  }
}

const updateSchema = Joi.object({
  name: Joi.string(),
  isActive: Joi.boolean(),
  ruleType: Joi.string().valid('percentage', 'specific_approver', 'hybrid'),
  percentageThreshold: Joi.number().min(0).max(100).allow(null),
  specificApproverId: Joi.string().allow(null),
  hybridOperator: Joi.string().valid('or', 'and'),
}).min(1);

export async function update(req, res, next) {
  try {
    const { error, value } = updateSchema.validate(req.body);
    if (error) throw new ValidationError(error.message);
    const rule = await ruleService.updateRule(req.user, req.params.id, value);
    res.json({ success: true, rule });
  } catch (e) {
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    await ruleService.deleteRule(req.user, req.params.id);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}
