import { ApprovalFlow } from '../models/ApprovalFlow.js';
import { Company } from '../models/Company.js';
import { AppError } from '../errors/AppError.js';

export async function getFlow(actor) {
  const company = await Company.findById(actor.companyId);
  if (!company?.approvalFlowId) return null;
  return ApprovalFlow.findById(company.approvalFlowId);
}

export async function upsertFlow(actor, { name, steps }) {
  if (actor.role !== 'admin') throw new AppError('Forbidden', 403);
  const company = await Company.findById(actor.companyId);
  if (!company) throw new AppError('Company not found', 404);

  let flow;
  if (company.approvalFlowId) {
    flow = await ApprovalFlow.findById(company.approvalFlowId);
    if (!flow) {
      flow = new ApprovalFlow({ companyId: company._id });
    }
  } else {
    flow = new ApprovalFlow({ companyId: company._id });
  }

  flow.name = name || flow.name || 'Approval flow';
  flow.steps = (steps || []).map((s, i) => ({
    order: s.order ?? i + 1,
    label: s.label || `Step ${i + 1}`,
    stepType: s.stepType,
    approverUserId: s.approverUserId || null,
  }));

  await flow.save();
  company.approvalFlowId = flow._id;
  await company.save();
  return flow;
}
