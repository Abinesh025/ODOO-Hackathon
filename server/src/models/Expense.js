import mongoose from 'mongoose';

const chainItemSchema = new mongoose.Schema(
  {
    order: Number,
    label: String,
    approverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'skipped'],
      default: 'pending',
    },
  },
  { _id: false }
);

const expenseSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, uppercase: true },
    convertedAmount: { type: Number, default: null },
    companyCurrency: { type: String, default: null },
    category: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    expenseDate: { type: Date, required: true },
    receiptUrl: { type: String, default: null },
    ocrExtracted: { type: mongoose.Schema.Types.Mixed, default: null },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvalChain: [chainItemSchema],
    currentStepIndex: { type: Number, default: 0 },
    approverUserIdsWhoApproved: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    completedByRule: { type: String, default: null },
    escalationNote: { type: String, default: null },
    escalatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

expenseSchema.index({ companyId: 1, submittedBy: 1, createdAt: -1 });
expenseSchema.index({ companyId: 1, status: 1 });

export const Expense = mongoose.model('Expense', expenseSchema);
