import mongoose from 'mongoose';

const stepSchema = new mongoose.Schema(
  {
    order: { type: Number, required: true },
    label: { type: String, required: true },
    stepType: {
      type: String,
      enum: ['manager', 'user'],
      required: true,
    },
    approverUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: false }
);

const approvalFlowSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, default: 'Default flow' },
    steps: [stepSchema],
  },
  { timestamps: true }
);

approvalFlowSchema.index({ companyId: 1 });

export const ApprovalFlow = mongoose.model('ApprovalFlow', approvalFlowSchema);
