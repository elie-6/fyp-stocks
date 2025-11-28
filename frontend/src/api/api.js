const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

export async function fetchTodayBullish() {
  const res = await fetch(`${API_BASE}/today_bullish`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return await res.json();
}

//  fetch full OHLCV history for a ticker
export async function fetchTickerHistory(ticker) {
  const res = await fetch(`${API_BASE}/ticker_history/${ticker}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return await res.json();
}

// fetch full indicator parquet
export async function fetchTickerIndicators(ticker) {
  const res = await fetch(`${API_BASE}/ticker_indicators/${ticker}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return await res.json();
}