const CACHE = new Map();
const TTL_MS = 1000 * 60 * 60 * 24;

export async function getCountryByCode(alpha2) {
  const code = alpha2?.toUpperCase();
  if (!code || code.length !== 2) return null;
  const cached = CACHE.get(code);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.data;

  const res = await fetch(`https://restcountries.com/v3.1/alpha/${code}`);
  if (!res.ok) return null;
  const data = await res.json();
  const c = Array.isArray(data) ? data[0] : data;
  if (!c) return null;
  const currencies = c.currencies || {};
  const firstKey = Object.keys(currencies)[0];
  const currency = firstKey ? firstKey : 'USD';
  const result = {
    name: c.name?.common || code,
    currency,
    region: c.region,
  };
  CACHE.set(code, { at: Date.now(), data: result });
  return result;
}

export async function listCountries() {
  const res = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,currencies');
  if (!res.ok) throw new Error('Failed to fetch countries');
  const list = await res.json();
  return list
    .map((c) => {
      const cur = c.currencies ? Object.keys(c.currencies)[0] : 'USD';
      return {
        code: c.cca2,
        name: c.name?.common || c.cca2,
        currency: cur,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
