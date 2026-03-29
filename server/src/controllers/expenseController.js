import Joi from 'joi';
import * as expenseService from '../services/expenseService.js';
import { runOcrOnImageFile } from '../services/ocrService.js';
import { ForbiddenError, ValidationError } from '../errors/AppError.js';
import path from 'path';
import { receiptPublicPath } from '../utils/upload.js';
import { User } from '../models/User.js';
import { sendExpenseDecisionEmail } from '../services/emailService.js';

const createSchema = Joi.object({
  amount: Joi.number().positive().required(),
  currency: Joi.string().length(3).required(),
  category: Joi.string().required(),
  description: Joi.string().allow(''),
  expenseDate: Joi.date().required(),
  ocrExtracted: Joi.object().unknown(true).allow(null),
});

const actSchema = Joi.object({
  action: Joi.string().valid('approve', 'reject').required(),
  comment: Joi.string().allow(''),
});

function notify(io, room, event, payload) {
  if (io && room) io.to(room).emit(event, payload);
}

export async function create(req, res, next) {
  try {
    let body = { ...req.body };
    if (typeof body.payload === 'string') {
      body = JSON.parse(body.payload);
    }
    if (typeof body.ocrExtracted === 'string' && body.ocrExtracted) {
      try {
        body.ocrExtracted = JSON.parse(body.ocrExtracted);
      } catch {
        body.ocrExtracted = null;
      }
    }
    const { error, value } = createSchema.validate(body, { convert: true, abortEarly: false });
    if (error) throw new ValidationError(error.message);
    const receipt = req.file
      ? receiptPublicPath(path.basename(req.file.path))
      : null;
    const expense = await expenseService.createExpense(req.user, value, receipt);
    const io = req.app.get('io');
    notify(io, `company:${req.user.companyId}`, 'expense_created', {
      type: 'expense_created',
      expenseId: expense._id,
    });
    res.status(201).json({ success: true, expense });
  } catch (e) {
    next(e);
  }
}

export async function mine(req, res, next) {
  try {
    const expenses = await expenseService.listMyExpenses(req.user);
    res.json({ success: true, expenses });
  } catch (e) {
    next(e);
  }
}

export async function pendingApprovals(req, res, next) {
  try {
    const expenses = await expenseService.listPendingForApprover(req.user);
    res.json({ success: true, expenses });
  } catch (e) {
    next(e);
  }
}

export async function team(req, res, next) {
  try {
    if (req.user.role !== 'manager') throw new ForbiddenError('Managers only');
    const expenses = await expenseService.listTeamExpenses(req.user);
    res.json({ success: true, expenses });
  } catch (e) {
    next(e);
  }
}

export async function all(req, res, next) {
  try {
    const expenses = await expenseService.listAllCompanyExpenses(req.user);
    res.json({ success: true, expenses });
  } catch (e) {
    next(e);
  }
}

export async function getOne(req, res, next) {
  try {
    const expense = await expenseService.getExpense(req.user, req.params.id);
    res.json({ success: true, expense });
  } catch (e) {
    next(e);
  }
}

export async function logs(req, res, next) {
  try {
    const logs = await expenseService.getLogs(req.user, req.params.id);
    res.json({ success: true, logs });
  } catch (e) {
    next(e);
  }
}

export async function act(req, res, next) {
  try {
    const { error, value } = actSchema.validate(req.body);
    if (error) throw new ValidationError(error.message);
    const expense = await expenseService.actOnExpense(req.user, req.params.id, value);
    const io = req.app.get('io');
    const sub = expense.submittedBy?.toString?.() || expense.submittedBy;

    // Rich notification payload for the expense submitter
    const notificationPayload = {
      type: 'expense_updated',
      expenseId: expense._id,
      status: expense.status,
      action: value.action,
      comment: value.comment || '',
      approverName: req.user.name,
      amount: expense.amount,
      currency: expense.currency,
      category: expense.category,
      description: expense.description || '',
    };

    // Send to the submitter specifically
    notify(io, `user:${sub}`, 'expense_updated', notificationPayload);
    // Also broadcast to company for dashboard updates
    notify(io, `company:${req.user.companyId}`, 'expense_updated', {
      type: 'expense_updated',
      expenseId: expense._id,
      status: expense.status,
    });

    // Send email notification (fire-and-forget)
    if (expense.status === 'approved' || expense.status === 'rejected') {
      const submitter = await User.findById(sub).select('email name').lean();
      if (submitter?.email) {
        sendExpenseDecisionEmail(
          { email: submitter.email, name: submitter.name },
          value.action === 'reject' ? 'reject' : 'approve',
          expense,
          { name: req.user.name },
          value.comment
        ).catch(() => {}); // never block response
      }
    }

    res.json({ success: true, expense });
  } catch (e) {
    next(e);
  }
}

export async function overrideApprove(req, res, next) {
  try {
    const expense = await expenseService.adminOverrideApprove(
      req.user,
      req.params.id,
      req.body.comment
    );
    const io = req.app.get('io');
    const sub = expense.submittedBy?.toString?.() || expense.submittedBy;

    // Rich notification payload for override approval
    notify(io, `user:${sub}`, 'expense_updated', {
      type: 'expense_updated',
      expenseId: expense._id,
      status: expense.status,
      action: 'approve',
      comment: req.body.comment || 'Admin override',
      approverName: req.user.name,
      amount: expense.amount,
      currency: expense.currency,
      category: expense.category,
      description: expense.description || '',
    });

    // Send email notification for admin override approval (fire-and-forget)
    const submitter = await User.findById(sub).select('email name').lean();
    if (submitter?.email) {
      sendExpenseDecisionEmail(
        { email: submitter.email, name: submitter.name },
        'approve',
        expense,
        { name: req.user.name },
        req.body.comment || 'Admin override'
      ).catch(() => {});
    }

    res.json({ success: true, expense });
  } catch (e) {
    next(e);
  }
}

export async function escalate(req, res, next) {
  try {
    const expense = await expenseService.escalateExpense(
      req.user,
      req.params.id,
      req.body.note
    );
    const io = req.app.get('io');
    notify(io, `company:${req.user.companyId}`, 'expense_escalated', {
      type: 'expense_escalated',
      expenseId: expense._id,
    });
    res.json({ success: true, expense });
  } catch (e) {
    next(e);
  }
}

export async function dashboard(req, res, next) {
  try {
    const stats = await expenseService.dashboardStats(req.user);
    res.json({ success: true, stats });
  } catch (e) {
    next(e);
  }
}

export async function ocrPreview(req, res, next) {
  try {
    if (!req.file) throw new ValidationError('Image required');
    const data = await runOcrOnImageFile(req.file.path);
    res.json({ success: true, ocr: data });
  } catch (e) {
    next(e);
  }
}
