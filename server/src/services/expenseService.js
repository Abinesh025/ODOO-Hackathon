import { Expense } from '../models/Expense.js';
import { ApprovalLog } from '../models/ApprovalLog.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { AppError } from '../errors/AppError.js';
import { convertAmount } from './currencyService.js';
import {
  buildApprovalChain,
  evaluateRulesOnApprove,
  getCurrentApprover,
  loadActiveRules,
} from './workflowService.js';
import { getTeamExpensesUserIds } from './userService.js';

function idEq(a, b) {
  return a && b && String(a) === String(b);
}

async function appendLog(expense, approverId, action, comment) {
  await ApprovalLog.create({
    expenseId: expense._id,
    companyId: expense.companyId,
    approverId,
    action,
    comment: comment || '',
  });
}

export async function createExpense(user, body, receiptUrl) {
  const {
    amount,
    currency,
    category,
    description,
    expenseDate,
    ocrExtracted,
  } = body;

  const { chain, company } = await buildApprovalChain(user.companyId, user._id);
  const conv = await convertAmount(
    Number(amount),
    currency,
    company.defaultCurrency
  );

  let status = 'pending';
  let currentStepIndex = 0;
  if (!chain.length) {
    status = 'approved';
    currentStepIndex = 0;
  }

  const expense = await Expense.create({
    companyId: user.companyId,
    submittedBy: user._id,
    amount: Number(amount),
    currency: currency.toUpperCase(),
    convertedAmount: conv.amount,
    companyCurrency: company.defaultCurrency,
    category,
    description: description || '',
    expenseDate: new Date(expenseDate),
    receiptUrl,
    ocrExtracted: ocrExtracted || null,
    status,
    approvalChain: chain,
    currentStepIndex,
    approverUserIdsWhoApproved: [],
    completedByRule: status === 'approved' ? 'No approvers configured' : null,
  });

  if (status === 'approved') {
    await appendLog(
      expense,
      user._id,
      'approved',
      'Auto-approved: no approval steps configured'
    );
  }

  await expense.populate('submittedBy', 'name email');
  return expense;
}

export async function listMyExpenses(user) {
  return Expense.find({ companyId: user.companyId, submittedBy: user._id })
    .sort({ createdAt: -1 })
    .populate('submittedBy', 'name email');
}

export async function listPendingForApprover(user) {
  const uid = user._id;
  const filter = {
    companyId: user.companyId,
    status: 'pending',
  };

  const expenses = await Expense.find(filter)
    .sort({ createdAt: -1 })
    .populate('submittedBy', 'name email');

  return expenses.filter((ex) => {
    const cur = getCurrentApprover(ex);
    if (!cur) return false;
    return idEq(cur.approverId, uid);
  });
}

export async function listTeamExpenses(manager) {
  const ids = await getTeamExpensesUserIds(manager._id);
  ids.push(manager._id);
  return Expense.find({
    companyId: manager.companyId,
    submittedBy: { $in: ids },
  })
    .sort({ createdAt: -1 })
    .populate('submittedBy', 'name email');
}

export async function listAllCompanyExpenses(admin) {
  if (admin.role !== 'admin') throw new AppError('Forbidden', 403);
  return Expense.find({ companyId: admin.companyId })
    .sort({ createdAt: -1 })
    .populate('submittedBy', 'name email');
}

export async function getExpense(user, id) {
  const ex = await Expense.findOne({ _id: id, companyId: user.companyId })
    .populate('submittedBy', 'name email role')
    .populate('approvalChain.approverId', 'name email');
  if (!ex) throw new AppError('Expense not found', 404);

  if (user.role === 'employee' && !idEq(ex.submittedBy._id, user._id)) {
    throw new AppError('Forbidden', 403);
  }
  if (user.role === 'manager') {
    const teamIds = await getTeamExpensesUserIds(user._id);
    const allowed =
      idEq(ex.submittedBy._id, user._id) ||
      teamIds.some((tid) => idEq(tid, ex.submittedBy._id));
    const cur = getCurrentApprover(ex);
    const isCurrent = cur && idEq(cur.approverId, user._id);
    if (!allowed && !isCurrent) throw new AppError('Forbidden', 403);
  }

  return ex;
}

export async function getLogs(user, expenseId) {
  await getExpense(user, expenseId);
  return ApprovalLog.find({ expenseId })
    .sort({ createdAt: 1 })
    .populate('approverId', 'name email role');
}

export async function actOnExpense(actor, expenseId, { action, comment }) {
  const expense = await Expense.findOne({
    _id: expenseId,
    companyId: actor.companyId,
  });
  if (!expense) throw new AppError('Expense not found', 404);
  if (expense.status !== 'pending') throw new AppError('Expense is not pending', 400);

  const cur = getCurrentApprover(expense);
  if (!cur) throw new AppError('No pending approval step', 400);

  if (!idEq(cur.approverId, actor._id)) {
    throw new AppError('Only the current approver can act on this expense', 403);
  }

  const rules = await loadActiveRules(expense.companyId);

  if (action === 'reject') {
    expense.status = 'rejected';
    expense.approvalChain.forEach((step, i) => {
      if (i >= expense.currentStepIndex && step.status === 'pending') {
        step.status = 'rejected';
      }
    });
    await expense.save();
    await appendLog(expense, actor._id, 'rejected', comment);
    return expense;
  }

  if (action !== 'approve') throw new AppError('Invalid action', 400);

  cur.status = 'approved';
  if (!expense.approverUserIdsWhoApproved.some((id) => idEq(id, actor._id))) {
    expense.approverUserIdsWhoApproved.push(actor._id);
  }

  const evalExpense = expense.toObject();
  evalExpense.approverUserIdsWhoApproved = [...expense.approverUserIdsWhoApproved];

  const ruleResult = await evaluateRulesOnApprove(evalExpense, actor._id, rules);

  if (ruleResult.complete) {
    expense.status = 'approved';
    expense.completedByRule = ruleResult.reason;
    expense.approvalChain.forEach((step) => {
      if (step.status === 'pending') step.status = 'skipped';
    });
    await expense.save();
    await appendLog(expense, actor._id, 'approved', comment || ruleResult.reason);
    return expense;
  }

  expense.currentStepIndex += 1;
  if (expense.currentStepIndex >= expense.approvalChain.length) {
    expense.status = 'approved';
  }
  await expense.save();
  await appendLog(expense, actor._id, 'approved', comment || '');
  return expense;
}

export async function adminOverrideApprove(actor, expenseId, comment) {
  if (actor.role !== 'admin') throw new AppError('Forbidden', 403);
  const expense = await Expense.findOne({
    _id: expenseId,
    companyId: actor.companyId,
  });
  if (!expense) throw new AppError('Expense not found', 404);
  expense.status = 'approved';
  expense.completedByRule = 'Admin override';
  expense.approvalChain.forEach((s) => {
    if (s.status === 'pending') s.status = 'skipped';
  });
  await expense.save();
  await appendLog(expense, actor._id, 'override_approved', comment || 'Override');
  return expense;
}

export async function escalateExpense(actor, expenseId, note) {
  const expense = await Expense.findOne({
    _id: expenseId,
    companyId: actor.companyId,
  });
  if (!expense) throw new AppError('Expense not found', 404);
  if (!['manager', 'employee'].includes(actor.role)) {
    throw new AppError('Forbidden', 403);
  }
  const submitter = await User.findById(expense.submittedBy);
  if (
    actor.role === 'employee' &&
    !idEq(submitter._id, actor._id)
  ) {
    throw new AppError('Forbidden', 403);
  }
  if (actor.role === 'manager' && !idEq(submitter.managerId, actor._id)) {
    const team = await getTeamExpensesUserIds(actor._id);
    if (!team.some((id) => idEq(id, submitter._id))) throw new AppError('Forbidden', 403);
  }

  expense.escalationNote = note || 'Escalated';
  expense.escalatedAt = new Date();
  await expense.save();
  await appendLog(expense, actor._id, 'escalated', note || '');
  return expense;
}

export async function dashboardStats(user) {
  const base = { companyId: user.companyId };
  const pendingMine = await Expense.countDocuments({
    ...base,
    status: 'pending',
    submittedBy: user._id,
  });

  let pendingApprovals = 0;
  if (user.role !== 'employee') {
    const all = await Expense.find({ ...base, status: 'pending' });
    pendingApprovals = all.filter((ex) => {
      const c = getCurrentApprover(ex);
      return c && idEq(c.approverId, user._id);
    }).length;
  }

  const approvedAgg = await Expense.aggregate([
    { $match: { ...base, status: 'approved' } },
    { $group: { _id: null, total: { $sum: '$convertedAmount' } } },
  ]);
  const totalSpend = approvedAgg[0]?.total || 0;

  const comp = await Company.findById(user.companyId);
  return {
    pendingMine,
    pendingApprovals,
    totalSpendApproved: totalSpend,
    currency: comp?.defaultCurrency || 'USD',
  };
}
