import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    defaultCurrency: { type: String, required: true, default: 'USD' },
    countryCode: { type: String, default: 'US' },
    approvalFlowId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalFlow', default: null },
    isManagerApproverFirst: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Company = mongoose.model('Company', companySchema);
