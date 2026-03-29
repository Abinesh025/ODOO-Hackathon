import { AppError } from '../errors/AppError.js';

export async function convertAmount(amount, fromCurrency, toCurrency) {
  const from = fromCurrency?.toUpperCase();
  const to = toCurrency?.toUpperCase();
  if (!from || !to) throw new AppError('Invalid currency', 400);
  if (from === to) return { amount, rate: 1 };

  const key = process.env.EXCHANGE_RATE_API_KEY;
  if (!key) {
    return { amount, rate: 1, fallback: true, note: 'EXCHANGE_RATE_API_KEY not set; returning 1:1' };
  }

  const url = `https://v6.exchangerate-api.com/v6/${key}/pair/${from}/${to}/${amount}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new AppError(`Currency conversion failed: ${text}`, 502);
  }
  const data = await res.json();
  if (data.result !== 'success') {
    throw new AppError(data['error-type'] || 'Conversion error', 502);
  }
  return {
    amount: data.conversion_result,
    rate: data.conversion_rate,
  };
}
