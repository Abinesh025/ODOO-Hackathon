import mongoose from 'mongoose';

const ruleSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    ruleType: {
      type: String,
      enum: ['percentage', 'specific_approver', 'hybrid'],
      required: true,
    },
    percentageThreshold: { type: Number, min: 0, max: 100, default: null },
    specificApproverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    hybridOperator: {
      type: String,
      enum: ['or', 'and'],
      default: 'or',
    },
  },
  { timestamps: true }
);

ruleSchema.index({ companyId: 1 });

export const Rule = mongoose.model('Rule', ruleSchema);
