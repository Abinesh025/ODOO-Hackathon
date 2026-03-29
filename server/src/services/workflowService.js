import { ApprovalFlow } from '../models/ApprovalFlow.js';
import { Company } from '../models/Company.js';
import { User } from '../models/User.js';
import { AppError } from '../errors/AppError.js';
import { Rule } from '../models/Rule.js';

function idEquals(a, b) {
  return a && b && String(a) === String(b);
}

export async function buildApprovalChain(companyId, submitterId) {
  const company = await Company.findById(companyId);
  if (!company) throw new AppError('Company not found', 404);

  const flow = company.approvalFlowId
    ? await ApprovalFlow.findById(company.approvalFlowId)
    : null;

  const submitter = await User.findById(submitterId);
  if (!submitter) throw new AppError('Submitter not found', 404);

  const chain = [];
  if (!flow || !flow.steps?.length) {
    if (company.isManagerApproverFirst && submitter.managerId) {
      return {
        chain: [
          {
            order: 0,
            label: 'Manager',
            approverId: submitter.managerId,
            status: 'pending',
          },
        ],
        company,
      };
    }
    return { chain, company };
  }

  const sorted = [...flow.steps].sort((a, b) => a.order - b.order);

  for (const step of sorted) {
    if (step.stepType === 'manager') {
      if (!submitter.managerId) {
        throw new AppError(
          'Manager approval step requires a reporting manager. Ask your admin to assign one.',
          400
        );
      }
      chain.push({
        order: step.order,
        label: step.label || 'Manager',
        approverId: submitter.managerId,
        status: 'pending',
      });
    } else if (step.stepType === 'user') {
      if (!step.approverUserId) continue;
      chain.push({
        order: step.order,
        label: step.label || 'Approver',
        approverId: step.approverUserId,
        status: 'pending',
      });
    }
  }

  if (company.isManagerApproverFirst && submitter.managerId) {
    const hasManager = chain.some((c) => idEquals(c.approverId, submitter.managerId));
    if (!hasManager) {
      chain.unshift({
        order: 0,
        label: 'Manager',
        approverId: submitter.managerId,
        status: 'pending',
      });
    }
  }

  const seen = new Set();
  const deduped = [];
  for (const item of chain) {
    const key = String(item.approverId);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  return { chain: deduped, company };
}

export function getCurrentApprover(expense) {
  const chain = expense.approvalChain || [];
  const idx = expense.currentStepIndex ?? 0;
  if (idx >= chain.length) return null;
  return chain[idx];
}

export async function evaluateRulesOnApprove(expense, actingUserId, rules) {
  const chain = expense.approvalChain || [];
  const total = chain.length || 1;
  const approvedIds = [...(expense.approverUserIdsWhoApproved || [])].map(String);

  const active = rules.filter((r) => r.isActive);

  for (const rule of active) {
    if (rule.ruleType === 'specific_approver' && rule.specificApproverId) {
      if (idEquals(actingUserId, rule.specificApproverId)) {
        return { complete: true, reason: `Rule: ${rule.name} (specific approver)` };
      }
    }
  }

  const approvalRatio = approvedIds.length / total;

  for (const rule of active) {
    if (rule.ruleType === 'percentage' && rule.percentageThreshold != null) {
      if (approvalRatio * 100 >= rule.percentageThreshold) {
        return { complete: true, reason: `Rule: ${rule.name} (${rule.percentageThreshold}% reached)` };
      }
    }
  }

  for (const rule of active) {
    if (rule.ruleType === 'hybrid') {
      const pctOk =
        rule.percentageThreshold != null && approvalRatio * 100 >= rule.percentageThreshold;
      const specOk =
        rule.specificApproverId && idEquals(actingUserId, rule.specificApproverId);

      if (rule.hybridOperator === 'or' && (pctOk || specOk)) {
        return { complete: true, reason: `Rule: ${rule.name} (hybrid OR)` };
      }
      if (rule.hybridOperator === 'and' && pctOk && specOk) {
        return { complete: true, reason: `Rule: ${rule.name} (hybrid AND)` };
      }
    }
  }

  return { complete: false };
}

export async function loadActiveRules(companyId) {
  return Rule.find({ companyId, isActive: true }).sort({ createdAt: 1 });
}
