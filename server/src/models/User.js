import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['admin', 'manager', 'employee'],
      required: true,
    },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    countryCode: { type: String, default: 'US' },
    preferredCurrency: { type: String, default: 'USD' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.index({ companyId: 1, email: 1 });

export const User = mongoose.model('User', userSchema);
