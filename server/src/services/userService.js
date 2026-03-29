import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { AppError } from '../errors/AppError.js';

export async function createUser(actor, payload) {
  if (actor.role !== 'admin') throw new AppError('Forbidden', 403);
  if (!['employee', 'manager'].includes(payload.role)) {
    throw new AppError('Role must be employee or manager', 400);
  }

  const exists = await User.findOne({ email: payload.email.toLowerCase() });
  if (exists) throw new AppError('Email already in use', 409);

  const passwordHash = await bcrypt.hash(payload.password, 12);
  const user = await User.create({
    email: payload.email.toLowerCase(),
    passwordHash,
    name: payload.name,
    role: payload.role,
    companyId: actor.companyId,
    managerId: payload.managerId || null,
    countryCode: payload.countryCode || actor.countryCode,
    preferredCurrency: payload.preferredCurrency || actor.preferredCurrency,
  });

  return User.findById(user._id).select('-passwordHash');
}

export async function updateUser(actor, userId, payload) {
  if (actor.role !== 'admin') throw new AppError('Forbidden', 403);
  const user = await User.findOne({ _id: userId, companyId: actor.companyId });
  if (!user) throw new AppError('User not found', 404);

  if (payload.name) user.name = payload.name;
  if (payload.role && ['employee', 'manager', 'admin'].includes(payload.role)) {
    user.role = payload.role;
  }
  if ('managerId' in payload) user.managerId = payload.managerId || null;
  if (payload.preferredCurrency) user.preferredCurrency = payload.preferredCurrency;
  await user.save();
  return User.findById(user._id).select('-passwordHash');
}

export async function deleteUser(actor, userId) {
  if (actor.role !== 'admin') throw new AppError('Forbidden', 403);
  if (String(actor._id) === String(userId)) {
    throw new AppError('You cannot delete yourself', 400);
  }
  const user = await User.findOne({ _id: userId, companyId: actor.companyId });
  if (!user) throw new AppError('User not found', 404);

  // Unlink any employees reporting to this user
  await User.updateMany({ managerId: userId }, { $set: { managerId: null } });

  await User.deleteOne({ _id: userId });
  return { id: userId };
}

export async function listUsers(actor) {
  if (actor.role !== 'admin') throw new AppError('Forbidden', 403);
  return User.find({ companyId: actor.companyId }).select('-passwordHash').sort({ name: 1 });
}

export async function getTeamExpensesUserIds(managerId) {
  const direct = await User.find({ managerId }).select('_id');
  return direct.map((u) => u._id);
}
