import { useEffect, useState } from 'react';
import { fetchTickerHistory } from '../api/api';



export default function TickerHistoryList({ ticker, children }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ticker) return;

    fetchTickerHistory(ticker)
      .then((res) => setData(Array.isArray(res) ? res : []))
      .catch((err) => setError(err.message || String(err)))
      .finally(() => setLoading(false));
  }, [ticker]);

  return typeof children === 'function' ? children({ data, loading, error }) : null;
}
