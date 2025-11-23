// src/components/TickerIndicatorsList.jsx
import { useState, useEffect } from 'react';
import { fetchTickerIndicators } from '../api/api';

export default function TickerIndicatorsList({ ticker, children }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ticker) return;

    setLoading(true);
    fetchTickerIndicators(ticker)
      .then((json) => {
        setData(Array.isArray(json) ? json : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || String(err));
        setLoading(false);
      });
  }, [ticker]);

  // Render-prop: return children({ data, loading, error })
  return typeof children === 'function' ? children({ data, loading, error }) : null;
}
