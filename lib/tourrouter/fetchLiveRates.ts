/**
 * Fetch live USD conversion rates from Frankfurter API.
 * Returns record where rate * foreign_amount = USD amount (i.e. rate = 1/X).
 * Timeout defaults to 3s. Returns empty object on failure.
 */
export async function fetchLiveRates(timeoutMs = 3000): Promise<Record<string, number>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch("https://api.frankfurter.app/latest?base=USD", {
      signal: controller.signal,
    });
    if (!resp.ok) return {};
    const data = await resp.json();
    const rates: Record<string, number> = {};
    for (const [currency, value] of Object.entries(data.rates)) {
      rates[currency] = 1 / (value as number);
    }
    return rates;
  } catch {
    return {};
  } finally {
    clearTimeout(timer);
  }
}
