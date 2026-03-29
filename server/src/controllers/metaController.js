import { listCountries } from '../services/countryService.js';

export async function countries(_req, res, next) {
  try {
    const countries = await listCountries();
    res.json({ success: true, countries });
  } catch (e) {
    next(e);
  }
}
