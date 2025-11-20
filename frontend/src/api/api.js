const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

export async function fetchTodayBullish() {
  const res = await fetch(`${API_BASE}/today_bullish`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return await res.json();
}
