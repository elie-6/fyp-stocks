import { useEffect, useState } from 'react';
import { fetchTodayBullish } from '../api/api';


export default function TodayBullishList({ children }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTodayBullish()
      .then((res) => {
        setData(Array.isArray(res) ? res : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || String(err));
        setLoading(false);
      });
  }, []);


  return typeof children === 'function' ? children({ data, loading, error }) : null;
}
