import { useEffect, useState } from 'react';
import { fetchTickerHistory } from '../api/api';

/*
  This component fetches a ticker's full OHLCV history from the backend.
  Usage (render-prop pattern):

  <TickerHistoryList ticker="GOOG">
    {({ data, loading, error }) => (
      // render whatever you want with the data
    )}
  </TickerHistoryList>
*/

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
