import { Company } from '../models/Company.js';
import { AppError } from '../errors/AppError.js';

export async function updateCompany(actor, payload) {
  if (actor.role !== 'admin') throw new AppError('Forbidden', 403);
  const company = await Company.findById(actor.companyId);
  if (!company) throw new AppError('Company not found', 404);
  if (payload.name) company.name = payload.name;
  if (payload.defaultCurrency) company.defaultCurrency = payload.defaultCurrency.toUpperCase();
  if (typeof payload.isManagerApproverFirst === 'boolean') {
    company.isManagerApproverFirst = payload.isManagerApproverFirst;
  }
  await company.save();
  return company;
}

export async function getCompany(actor) {
  return Company.findById(actor.companyId);
}
