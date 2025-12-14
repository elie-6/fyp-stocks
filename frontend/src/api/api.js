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

// --- Login / Auth functions ---
export async function loginUser(email, password) {
  const res = await fetch(`http://127.0.0.1:8000/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Login failed");
  }

  const data = await res.json();
  localStorage.setItem("token", data.access_token);
  return data;
}

export async function signupUser(email, password) {
  const res = await fetch(`http://127.0.0.1:8000/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Signup failed");
  }

  const data = await res.json();
  localStorage.setItem("token", data.access_token);
  return data;
}

export function getToken() {
  return localStorage.getItem("token");
}

export function logoutUser() {
  localStorage.removeItem("token");
}

// Optional: helper to include token in fetch requests
export function authFetch(url, options = {}) {
  const token = getToken();
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
  });
}

// --- Wallet / Trading functions ---
export async function getWalletValue() {
  const res = await authFetch(`http://127.0.0.1:8000/wallet/value`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to fetch wallet value");
  }
  return await res.json();
}

export async function buyTicker(ticker, quantity) {
  const res = await authFetch(`http://127.0.0.1:8000/wallet/buy`, {
    method: "POST",
    body: JSON.stringify({ ticker, quantity: quantity.toString() }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Buy failed");
  }
  return await res.json();
}

export async function sellTicker(ticker, quantity) {
  const res = await authFetch(`http://127.0.0.1:8000/wallet/sell`, {
    method: "POST",
    body: JSON.stringify({ ticker, quantity: quantity.toString() }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Sell failed");
  }
  return await res.json();
}

export async function fetchLivePrice(ticker) {
  const res = await authFetch(`http://127.0.0.1:8000/wallet/live_price/${ticker}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to fetch live price");
  }
  return await res.json(); // returns { ticker, price }
}

// Fetch all tickers dynamically from backend
export async function fetchAllTickers() {
  const res = await fetch(`${API_BASE}/tickers/`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const data = await res.json();
  return data.tickers; // returns ["AAPL", "AMZN", "GOOG", ...]
}