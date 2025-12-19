# FYP-Stocks

A stock analysis platform built for educational trading, emphasizing data quality, transparent analytics, and clean architecture.

## 🎯 Overview

FYP-Stocks is a full-stack web application that fetches historical stock data from Yahoo Finance, validates and cleans it, computes technical indicators, and presents an explainable bullish score through an interactive dashboard. Users can simulate trading with a virtual wallet to practice without financial risk.

---

## ✨ Key Features

- **Data Validation Pipeline**: Handles missing values, inconsistent timestamps, and data quality issues from Yahoo Finance
- **Technical Indicators**: Computes ROC, EMA, RSI, ATR, Volume Ratio, and breakout signals
- **Bullish Score**: Transparent, weighted aggregation of indicators (no black-box ML)
- **Virtual Trading**: Practice buying and selling stocks with a simulated $10,000 portfolio
- **Interactive Charts**: TradingView-style candlesticks with indicator overlays
- **Real-time Updates**: Live price fetching and portfolio value tracking

---

### Technology Stack

**Backend:**
- FastAPI (Python 3.9+)
- PostgreSQL + SQLModel
- NumPy + Pandas for data processing
- Apache Parquet for time-series storage
- bcrypt + JWT for authentication

**Frontend:**
- React 19 + Vite
- React Router for navigation
- lightweight-charts (TradingView candlesticks)
- react-sparklines (mini trend charts)
- recharts (indicator comparisons)

**Data Pipeline:**
- yfinance for market data
- Incremental updates (daily cron)
- Atomic Parquet writes

---

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL 14+

### 1. Clone Repository

```bash
git clone https://github.com/elie-6/fyp-stocks.git
cd fyp-stocks
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://user:password@localhost:5432/fyp_stocks
JWT_SECRET=your-secret-key-change-this
EOF

# Initialize database
python -c "from app.database import create_db_and_tables; create_db_and_tables()"

# Fetch initial data (takes ~2 minutes for 10 tickers)
python save_tickers_to_parquet_single.py
python compute_bullish.py

# Start backend server
uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## 📊 Data Pipeline

The system processes data in stages:

1. **Fetch**: Pull OHLCV data from Yahoo Finance per ticker
2. **Validate**: Remove NaNs, normalize timestamps, handle missing days
3. **Store**: Write to Parquet files (columnar, compressed)
4. **Calculate**: Compute 6 technical indicators per symbol
5. **Normalize**: Percentile-rank normalization for comparability
6. **Score**: Weighted aggregation into bullish score (0-100%)

### Bullish Score Formula

```
Score = (0.30 × ROC_10) + (0.25 × EMA50_dist) + (0.15 × Volume_ratio)
      + (0.10 × RSI14) + (0.20 × New_high50) - (0.10 × ATR_pct)
```

All indicators are normalized using percentile ranking relative to each ticker's historical distribution.

---

## 📡 API Endpoints

### Authentication
- `POST /auth/signup` - Create account
- `POST /auth/login` - Get JWT token
- `GET /auth/me` - Get current user

### Data
- `GET /api/today_bullish` - Latest bullish scores
- `GET /api/ticker_history/{ticker}` - OHLCV history
- `GET /api/ticker_indicators/{ticker}` - Computed indicators
- `GET /api/tickers/` - List available tickers

### Wallet (Requires Auth)
- `POST /wallet/buy` - Buy stocks
- `POST /wallet/sell` - Sell stocks
- `GET /wallet/value` - Portfolio value
- `GET /wallet/live_price/{ticker}` - Current price

---


## 🔧 Configuration

### Tracked Tickers

Edit `backend/save_tickers_to_parquet_single.py`:
```python
TICKERS = ['AAPL', 'AMZN', 'GOOG', 'MSFT', 'TSLA', 'NVDA', 'PLTR', 'ORCL', 'NFLX', 'META']
```

### Bullish Score Weights

Edit `backend/compute_bullish.py`:
```python
w_ROC, w_EMA, w_Vol, w_RSI, w_High, w_ATR = 0.3, 0.25, 0.15, 0.1, 0.2, 0.1
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/
```

### Manual Testing Checklist
- [ ] Signup/Login flow works
- [ ] Dashboard displays top bullish stocks
- [ ] Ticker page shows charts and indicators
- [ ] Buy operation deducts cash and creates holding
- [ ] Sell operation adds cash and reduces holding
- [ ] Portfolio value updates with live prices

---

## 📈 Performance

- **API Response Time**: 50-300ms per request
- **Data Pipeline**: ~15 seconds for daily updates (10 tickers)
- **Parquet Read**: ~150ms for full ticker history
- **Frontend Load**: <600ms initial page render

---

## 🛠️ Development

### Project Structure

```
fyp-stocks/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── database.py          # SQLModel schemas
│   │   ├── auth.py              # JWT authentication
│   │   └── wallet.py            # Trading logic
│   ├── save_tickers_to_parquet_single.py  # Data fetching
│   ├── compute_bullish.py       # Indicator calculation
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/               # React pages
│   │   ├── components/          # Reusable components
│   │   └── api/                 # API client
│   └── package.json
├── data/parquet/                # OHLCV storage
├── indicators/parquet/          # Computed indicators
└── today_bullish_scores/        # Daily rankings
```

### Adding New Indicators

1. Edit `compute_bullish.py`
2. Add calculation in `calculate_indicators_and_score()`
3. Add normalization: `df['YOUR_INDICATOR_norm'] = df['YOUR_INDICATOR'].rank(pct=True)`
4. Update bullish score formula with new weight

---

## ⚠️ Limitations

- **Data Source**: Yahoo Finance can have delays, missing data, or errors
- **No Real Trading**: Simulated portfolio only (no broker integration)
- **End-of-Day Data**: No intraday or real-time tick data
- **Single Currency**: USD only

---

## 🔮 Future Enhancements

- [ ] Strategy backtesting engine
- [ ] Real-time data feeds (WebSocket)
- [ ] ML model for more accurate weighting
- [ ] Mobile app (React Native)
- [ ] Multi-asset support (crypto, forex)
- [ ] Social features (share portfolios)
- [ ] Paper trading competitions

---


## 👨‍💻 Author

**Elie Abi Safi**  
Computer Science - Final Year Project  
[GitHub](https://github.com/elie-6) 

---

## 🙏 Acknowledgments

- **Yahoo Finance** for free market data access
- **FastAPI** for excellent API framework
- **TradingView** for lightweight-charts library

---

**⭐ If you find this project useful, please consider giving it a star!**
