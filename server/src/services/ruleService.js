import { Rule } from '../models/Rule.js';
import { AppError } from '../errors/AppError.js';

export async function listRules(actor) {
  if (actor.role !== 'admin') throw new AppError('Forbidden', 403);
  return Rule.find({ companyId: actor.companyId }).sort({ createdAt: -1 });
}

export async function createRule(actor, payload) {
  if (actor.role !== 'admin') throw new AppError('Forbidden', 403);
  return Rule.create({
    companyId: actor.companyId,
    name: payload.name,
    isActive: payload.isActive !== false,
    ruleType: payload.ruleType,
    percentageThreshold: payload.percentageThreshold ?? null,
    specificApproverId: payload.specificApproverId ?? null,
    hybridOperator: payload.hybridOperator || 'or',
  });
}

export async function updateRule(actor, ruleId, payload) {
  if (actor.role !== 'admin') throw new AppError('Forbidden', 403);
  const rule = await Rule.findOne({ _id: ruleId, companyId: actor.companyId });
  if (!rule) throw new AppError('Rule not found', 404);
  for (const key of Object.keys(payload)) {
    if (payload[key] !== undefined) rule[key] = payload[key];
  }
  await rule.save();
  return rule;
}

export async function deleteRule(actor, ruleId) {
  if (actor.role !== 'admin') throw new AppError('Forbidden', 403);
  await Rule.deleteOne({ _id: ruleId, companyId: actor.companyId });
}
