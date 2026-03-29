import mongoose from 'mongoose';

const approvalLogSchema = new mongoose.Schema(
  {
    expenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    approverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      enum: ['approved', 'rejected', 'comment', 'escalated', 'override_approved'],
      required: true,
    },
    comment: { type: String, default: '' },
  },
  { timestamps: true }
);

approvalLogSchema.index({ expenseId: 1, createdAt: -1 });

export const ApprovalLog = mongoose.model('ApprovalLog', approvalLogSchema);
