import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { fetchTickerHistory, getWalletValue, buyTicker, sellTicker, fetchLivePrice, fetchAllTickers } from '../api/api';
import './Wallet.css';

export default function Wallet() {
  const navigate = useNavigate();

  const [wallet, setWallet] = useState({ cash: 0, balance: 0, holdings: [] });
  const [tickersData, setTickersData] = useState([]);
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [quantity, setQuantity] = useState(0);
  const [livePrice, setLivePrice] = useState(0);
  const [error, setError] = useState(null);

  // redirect to login if no token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
    }
  }, [navigate]);

  // Load wallet info
  const loadWallet = async () => {
    try {
      const data = await getWalletValue();
      setWallet({
        cash: data.cash,
        balance: data.total_value, // rename total_value -> balance
        holdings: data.holdings
      });
    } catch (e) {
      setError(e.message);
    }
  };

  // Load tickers dynamically
  const loadTickers = async () => {
    try {
      const allTickers = await fetchAllTickers();
      const tickersInfo = await Promise.all(
        allTickers.map((ticker) =>
          new Promise((resolve) => {
            fetchTickerHistory(ticker).then((hist) => {
              const lastClose = hist[hist.length - 1]?.close || 0;
              const sevenDaysAgo = hist[hist.length - 8]?.close || lastClose;
              const changePct = ((lastClose - sevenDaysAgo) / sevenDaysAgo) * 100;
              resolve({ ticker, lastClose, changePct: changePct.toFixed(2) });
            }).catch(() => resolve({ ticker, lastClose: 0, changePct: "0.00" }));
          })
        )
      );
      setTickersData(tickersInfo);
      if (tickersInfo.length) setSelectedTicker(tickersInfo[0].ticker);
    } catch (e) {
      setError(e.message);
    }
  };

  // Fetch live price for selected ticker every 5 seconds
  useEffect(() => {
    let interval;
    if (selectedTicker) {
      const fetchPrice = async () => {
        try {
          const data = await fetchLivePrice(selectedTicker);
          setLivePrice(data.price);
        } catch (e) {
          setError(e.message);
        }
      };
      fetchPrice();
      interval = setInterval(fetchPrice, 5000);
    }
    return () => interval && clearInterval(interval);
  }, [selectedTicker]);

  // initial load + poll wallet value every 60 seconds
  useEffect(() => {
    loadWallet();
    loadTickers();

    const POLL_MS = 60000; // 60 seconds
    const id = setInterval(() => {
      loadWallet(); // will call GET /wallet/value and update state
    }, POLL_MS);

    return () => clearInterval(id);
  }, []);

  const handleBuy = async () => {
    if (!selectedTicker || quantity <= 0) return;
    try {
      await buyTicker(selectedTicker, quantity);
      setQuantity(0);
      await loadWallet();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleSell = async () => {
    if (!selectedTicker || quantity <= 0) return;
    try {
      await sellTicker(selectedTicker, quantity);
      setQuantity(0);
      await loadWallet();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      <Header />
      <div className="wallet-page">
        <div className="wallet-left">
          <h2 className="section-title">Tickers</h2>
          <div className="ticker-list">
            {tickersData.map((t) => (
              <div
                key={t.ticker}
                className={`ticker-card ${selectedTicker === t.ticker ? 'selected' : ''}`}
                onClick={() => setSelectedTicker(t.ticker)}
              >
                <div className="ticker-name">{t.ticker}</div>
                <div className={`ticker-change ${t.changePct >= 0 ? 'positive' : 'negative'}`}>
                  {t.changePct}% (7d)
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="wallet-right">
          <h2 className="section-title">Wallet</h2>
          <div className="wallet-balances">
            <div>Balance: ${wallet.balance.toFixed(2)}</div>
            <div>Cash Available: ${wallet.cash.toFixed(2)}</div>
          </div>

          <div className="wallet-actions">
            <div>
              <label>Select Ticker:</label>
              <div>{selectedTicker || 'None'}</div>
            </div>
            <div>
              <label>Live Price:</label>
              <div>${livePrice.toFixed(2)}</div>
            </div>
            <div>
              <label>Quantity:</label>
              <input
                type="number"
                value={quantity}
                min="0"
                step="0.1"
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>
            <div className="action-buttons">
              <button className="buy-btn" onClick={handleBuy}>Buy</button>
              <button className="sell-btn" onClick={handleSell}>Sell</button>
            </div>
          </div>

          <div className="wallet-holdings">
            <h3>Holdings</h3>
            {wallet.holdings.length === 0 && <div>No holdings</div>}
            {wallet.holdings.map((h) => (
              <div key={h.ticker} className="holding-card">
                <div>{h.ticker}</div>
                <div>{h.quantity} shares @ ${h.current_price.toFixed(2)} = ${h.holding_value.toFixed(2)}</div>
              </div>
            ))}
          </div>

          {error && <div className="error">{error}</div>}
        </div>
      </div>
    </>
  );
}
