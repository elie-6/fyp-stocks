import { useEffect, useState } from 'react';
import { fetchTodayBullish } from '../api/api';

/*
  This component fetches today's bullish data from the backend.
  It can be used in two ways:

  1️⃣ As a data provider for render-prop (Dashboard):
     <TodayBullishList>
       {({ data, loading, error }) => (
         // render whatever you want with the data
       )}
     </TodayBullishList>
*/
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

  // If a render-prop function is provided
  return typeof children === 'function' ? children({ data, loading, error }) : null;
}
