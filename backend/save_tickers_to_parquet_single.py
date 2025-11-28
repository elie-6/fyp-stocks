#!/usr/bin/env python3
"""
Save multiple tickers into single parquet files (one file per ticker).
"""
import os
import tempfile
import shutil
from datetime import datetime
from typing import List, Optional

import pandas as pd
import yfinance as yf

# ---------- Config ----------
PARQUET_ROOT = os.environ.get("PARQUET_ROOT", "data/parquet")
TICKERS = ['AAPL', 'AMZN', 'GOOG', 'MSFT', 'TSLA', 'NVDA', 'PLTR', 'ORCL', 'NFLX','META']  
INTERVAL = "1d"                      # '1d', '1h', '1m'
AUTO_ADJUST = True                   # yfinance auto_adjust
PYARROW_ENGINE = "pyarrow"
SNAPPY_COMPRESSION = "snappy"
LOOKBACK_DAYS_IF_NO_FILE = 90        # how many days to fetch on first run

# ---------- Helpers ----------
def _ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)

def _atomic_parquet_write(df: pd.DataFrame, path: str):
    """
    Write DataFrame to `path` atomically: write to temp file then move.
    
    """
    _ensure_dir(os.path.dirname(path) or ".")
    tmpdir = tempfile.mkdtemp(dir=os.path.dirname(path) or ".")
    try:
        tmpfile = os.path.join(tmpdir, "tmp.parquet")
        df.to_parquet(tmpfile, engine=PYARROW_ENGINE, index=False, compression=SNAPPY_COMPRESSION)
        shutil.move(tmpfile, path)
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

def fetch_stock_data(ticker: str, start: Optional[str] = None, end: Optional[str] = None) -> pd.DataFrame:
    """
    Simple wrapper around yfinance.download that returns a flattened DataFrame.
    """
    df = yf.download(ticker, start=start, end=end, interval=INTERVAL, auto_adjust=AUTO_ADJUST, progress=False)
    if df is None or df.empty:
        return pd.DataFrame()
    df = df.reset_index()
    # Flatten MultiIndex columns if present
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = ['_'.join(filter(None, map(str, col))).strip() for col in df.columns.values]
    df.columns = [str(c) for c in df.columns]
    return df

def _flatten_and_normalize(df: pd.DataFrame, ticker: str) -> pd.DataFrame:
    """
    Normalize the DataFrame:
      - ensure canonical columns: ticker, timestamp, open, high, low, close, adj_close, volume
    """
    if df is None or df.empty:
        return pd.DataFrame()

    df = df.reset_index()
    df.columns = [str(c) for c in df.columns]

    col_map = {}
    for c in df.columns:
        lc = c.lower()
        if lc == "date" or lc.endswith("date") or "date" in lc and "time" in lc:
            col_map[c] = "timestamp"
        elif "open" in lc:
            col_map[c] = "open"
        elif "high" in lc:
            col_map[c] = "high"
        elif "low" in lc:
            col_map[c] = "low"
        elif "close" in lc and "adj" not in lc:
            col_map[c] = "close"
        elif "adj" in lc and "close" in lc:
            col_map[c] = "adj_close"
        elif "volume" in lc:
            col_map[c] = "volume"

    if col_map:
        df = df.rename(columns=col_map)

    df["ticker"] = ticker.upper()

    # ensure timestamp exists and is tz-naive
    if "timestamp" not in df.columns:
        # fallback to first column if exists
        if df.shape[1] > 0:
            df["timestamp"] = pd.to_datetime(df.iloc[:, 0])
        else:
            df["timestamp"] = pd.NaT

    df["timestamp"] = pd.to_datetime(df["timestamp"]).dt.tz_localize(None)
    df["date"] = df["timestamp"].dt.strftime("%Y-%m-%d")

    # guarantee canonical columns
    canonical = ["ticker", "date", "timestamp", "open", "high", "low", "close", "adj_close", "volume"]
    for col in canonical:
        if col not in df.columns:
            df[col] = pd.NA

    # reorder
    df = df[canonical]
    return df

# ---------- Core incremental save (single ticker) ----------
def save_ticker_incremental(ticker: str, lookback_days: int = LOOKBACK_DAYS_IF_NO_FILE):
    """
    Fetch latest data and append/merge into a single parquet file per ticker.
    Behavior:
      - If file exists: fetch data starting from (last saved date + 1 day).
      - If file doesn't exist: fetch last `lookback_days` days.
      - Normalize, dedupe by timestamp, sort, and write atomically.
    """
    _ensure_dir(PARQUET_ROOT)
    path = os.path.join(PARQUET_ROOT, f"{ticker.upper()}.parquet")

    # determine fetch start
    if os.path.exists(path):
        try:
            existing = pd.read_parquet(path, engine=PYARROW_ENGINE)
            if existing.empty:
                start_date = (datetime.utcnow().date() - pd.Timedelta(days=lookback_days)).isoformat()
                print(f"{ticker}: existing file empty, fetching last {lookback_days} days")
            else:
                # ensure timestamp column is datetime
                existing["timestamp"] = pd.to_datetime(existing["timestamp"])
                last_ts = existing["timestamp"].max()
                start_date = (last_ts.date() + pd.Timedelta(days=1)).isoformat()
                print(f"{ticker}: found existing file, fetching since {start_date}")
        except Exception as e:
            # if anything goes wrong reading existing, fallback to fetching lookback range
            existing = pd.DataFrame()
            start_date = (datetime.utcnow().date() - pd.Timedelta(days=lookback_days)).isoformat()
            print(f"{ticker}: warning reading existing file ({e}); fetching last {lookback_days} days")
    else:
        existing = pd.DataFrame()
        start_date = (datetime.utcnow().date() - pd.Timedelta(days=lookback_days)).isoformat()
        print(f"{ticker}: no existing file, fetching last {lookback_days} days")

    end_date = datetime.utcnow().date().isoformat()

    # if start_date is after end_date, nothing to fetch
    if pd.to_datetime(start_date).date() > pd.to_datetime(end_date).date():
        print(f"{ticker}: up-to-date (no new date range to fetch)")
        return

    raw = fetch_stock_data(ticker, start=start_date, end=end_date)
    if raw is None or raw.empty:
        print(f"{ticker}: no new data fetched")
        return

    df_new = _flatten_and_normalize(raw, ticker)
    if df_new.empty:
        print(f"{ticker}: normalized data empty after fetch")
        return

    # compute how many truly new rows vs existing (for a nicer log)
    if not existing.empty and "timestamp" in existing.columns:
        existing_ts = pd.to_datetime(existing["timestamp"]).dt.tz_localize(None)
        # new rows that have timestamp not in existing
        new_rows_mask = ~df_new["timestamp"].isin(existing_ts)
        new_rows_count = int(new_rows_mask.sum())
    else:
        new_rows_count = len(df_new)

    # combine and dedupe (keep last, sort)
    if not existing.empty:
        combined = pd.concat([existing, df_new], ignore_index=True)
    else:
        combined = df_new

    combined["timestamp"] = pd.to_datetime(combined["timestamp"]).dt.tz_localize(None)
    combined.drop_duplicates(subset=["timestamp"], keep="last", inplace=True)
    combined.sort_values("timestamp", inplace=True)
    combined.reset_index(drop=True, inplace=True)

    # atomic write to final path
    _atomic_parquet_write(combined, path)

    print(f"{ticker}: added {new_rows_count} new rows (total {len(combined)})")

# ---------- One-liner daily update  ----------
def daily_update_tickers(tickers: List[str] = TICKERS):
    """
    One-line-style daily updater: calls the incremental updater for each ticker.

    can be called from cron or scheduler.
    """
    for ticker in tickers:
        save_ticker_incremental(ticker)

# ---------- Main: run daily update  ----------
if __name__ == "__main__":
    print("Starting incremental update for tickers...")
    daily_update_tickers()
    print("Done.")
