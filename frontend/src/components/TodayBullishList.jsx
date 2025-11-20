import { useEffect, useState } from 'react';
import { fetchTodayBullish } from '../api/api';

export default function TodayBullishList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTodayBullish()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading bullish scores...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!Array.isArray(data) || data.length === 0) return <p>No data available</p>;

  return (
    <div>
      <h2>Today's Bullish Ranking</h2>
      <ul>
        {data.map((row) => (
          <li key={row.ticker}>
            {row.ticker}: {row.bullish_score?.toFixed(2) ?? 'N/A'}
          </li>
        ))}
      </ul>
    </div>
  );
}

