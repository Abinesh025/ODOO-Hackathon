import Tesseract from 'tesseract.js';
import path from 'path';
import fs from 'fs/promises';

const CATEGORIES = ['Food', 'Travel', 'Lodging', 'Office', 'Software', 'Transport', 'Other'];

function inferCategory(text) {
  const t = text.toLowerCase();
  if (/uber|lyft|taxi|flight|airline|hotel|airbnb/.test(t)) return 'Travel';
  if (/restaurant|cafe|coffee|food|mcdonald|starbucks/.test(t)) return 'Food';
  if (/amazon|office|staples/.test(t)) return 'Office';
  return 'Other';
}

function parseAmountFromText(text) {
  const m = text.match(/\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)/);
  if (m) return parseFloat(m[1].replace(/,/g, ''));
  return null;
}

function parseDateFromText(text) {
  const iso = text.match(/(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (iso) return new Date(`${iso[1]}-${iso[2]}-${iso[3]}`);
  const us = text.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (us) {
    const y = us[3].length === 2 ? `20${us[3]}` : us[3];
    return new Date(`${y}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`);
  }
  return null;
}

export async function runOcrOnImageFile(filePath) {
  const abs = path.resolve(filePath);
  try {
    await fs.access(abs);
  } catch {
    return mockOcr('File not found');
  }

  try {
    const {
      data: { text },
    } = await Tesseract.recognize(abs, 'eng', { logger: () => {} });
    return buildResult(text);
  } catch (e) {
    console.warn('Tesseract OCR failed, using mock:', e.message);
    return mockOcr('OCR engine fallback');
  }
}

function buildResult(rawText) {
  const text = rawText.replace(/\s+/g, ' ').trim();
  const amount = parseAmountFromText(text);
  const date = parseDateFromText(text);
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const merchant = lines[0]?.slice(0, 120) || '';
  const category = inferCategory(text);

  return {
    rawText: text.slice(0, 4000),
    amount,
    date: date ? date.toISOString() : null,
    merchantName: merchant,
    description: lines.slice(0, 3).join(' — ').slice(0, 500),
    lineItems: lines.slice(0, 8).map((line, i) => ({ line: i + 1, text: line })),
    suggestedCategory: category,
    categories: CATEGORIES,
  };
}

function mockOcr(reason) {
  return {
    rawText: '',
    amount: null,
    date: null,
    merchantName: '',
    description: reason,
    lineItems: [],
    suggestedCategory: 'Other',
    categories: CATEGORIES,
    mock: true,
  };
}
