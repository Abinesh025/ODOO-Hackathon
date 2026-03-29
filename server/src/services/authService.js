import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { ApprovalFlow } from '../models/ApprovalFlow.js';
import { AppError } from '../errors/AppError.js';
import { getCountryByCode } from './countryService.js';

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

export async function signup({ email, password, name, countryCode }) {
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new AppError('Email already registered', 409);

  const country = await getCountryByCode(countryCode || 'US');
  const defaultCurrency = country?.currency || 'USD';
  const cc = (countryCode || 'US').toUpperCase();

  const company = await Company.create({
    name: `${name}'s Organization`,
    defaultCurrency,
    countryCode: cc,
    isManagerApproverFirst: true,
  });

  const flow = await ApprovalFlow.create({
    companyId: company._id,
    name: 'Default sequential flow',
    steps: [],
  });

  company.approvalFlowId = flow._id;
  await company.save();

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    email: email.toLowerCase(),
    passwordHash,
    name,
    role: 'admin',
    companyId: company._id,
    countryCode: cc,
    preferredCurrency: defaultCurrency,
  });

  const token = signToken(user._id);
  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      preferredCurrency: user.preferredCurrency,
    },
  };
}

export async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new AppError('Invalid credentials', 401);
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new AppError('Invalid credentials', 401);

  const token = signToken(user._id);
  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      preferredCurrency: user.preferredCurrency,
    },
  };
}
