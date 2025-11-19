import os
import pandas as pd
import tempfile
import shutil

# ---------- Paths ----------
RAW_PARQUET_ROOT = "data/parquet"                # raw OHLCV data
INDICATORS_ROOT = "indicators/parquet"          # indicators per ticker
TODAY_BULLISH_PATH = "today_bullish_scores/parquet/today_bullish_scores.parquet"

os.makedirs(INDICATORS_ROOT, exist_ok=True)
os.makedirs(os.path.dirname(TODAY_BULLISH_PATH), exist_ok=True)

# ---------- Delete old today’s bullish score ----------
if os.path.exists(TODAY_BULLISH_PATH):
    os.remove(TODAY_BULLISH_PATH)
    print(f"Deleted old today’s bullish score file → {TODAY_BULLISH_PATH}")

# ---------- Atomic write helper ----------
def atomic_parquet_write(df: pd.DataFrame, path: str):
    tmpdir = tempfile.mkdtemp(dir=os.path.dirname(path) or ".")
    try:
        tmpfile = os.path.join(tmpdir, "tmp.parquet")
        df.to_parquet(tmpfile, index=False)
        shutil.move(tmpfile, path)
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

# ---------- Indicator + bullish score calculation ----------
def calculate_indicators_and_score(df: pd.DataFrame) -> pd.DataFrame:
    df = df.sort_values('timestamp').reset_index(drop=True)

    df['date'] = df['timestamp'].dt.strftime('%Y-%m-%d')
    
    # ROC10
    df['ROC_10'] = df['close'].pct_change(10)
    
    # EMA50 distance
    df['EMA50'] = df['close'].ewm(span=50, adjust=False).mean()
    df['EMA50_dist'] = (df['close'] - df['EMA50']) / df['EMA50']
    
    # Volume ratio
    df['volume_20d_avg'] = df['volume'].rolling(20).mean()
    df['Volume_ratio'] = (df['volume'] / df['volume_20d_avg']).clip(upper=3)
    
    # RSI14 normalized
    delta = df['close'].diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.rolling(14).mean()
    avg_loss = loss.rolling(14).mean()
    RS = avg_gain / avg_loss
    df['RSI14'] = 100 - (100 / (1 + RS))
    df['RSI14_norm'] = ((df['RSI14'] - 30) / (70 - 30)).clip(0,1)
    
    # New 50-day high
    df['high50'] = df['close'].rolling(50).max()
    df['New_high50'] = (df['close'] >= df['high50']).astype(int)
    
    # ATR_pct
    df['H-L'] = df['high'] - df['low']
    df['H-Cp'] = abs(df['high'] - df['close'].shift(1))
    df['L-Cp'] = abs(df['low'] - df['close'].shift(1))
    df['TR'] = df[['H-L','H-Cp','L-Cp']].max(axis=1)
    df['ATR14'] = df['TR'].rolling(14).mean()
    df['ATR_pct'] = df['ATR14'] / df['close']
    
    # ---------- Normalization & bullish score ----------
    w_ROC, w_EMA, w_Vol, w_RSI, w_High, w_ATR = 0.3, 0.25, 0.15, 0.1, 0.2, 0.1
    df['ROC_10_norm'] = df['ROC_10'].rank(pct=True)
    df['EMA50_dist_norm'] = df['EMA50_dist'].rank(pct=True)
    df['Volume_ratio_norm'] = df['Volume_ratio'].rank(pct=True)
    df['ATR_pct_norm'] = df['ATR_pct'].rank(pct=True)
    
    df['bullish_score'] = (
        w_ROC * df['ROC_10_norm'] +
        w_EMA * df['EMA50_dist_norm'] +
        w_Vol * df['Volume_ratio_norm'] +
        w_RSI * df['RSI14_norm'] +
        w_High * df['New_high50'] -
        w_ATR * df['ATR_pct_norm']
    )
    
    # Keep only the **indicator + score columns + timestamp**
    cols_to_keep = [
        'date','timestamp', 'ROC_10_norm', 'EMA50_dist_norm',
        'Volume_ratio_norm', 'RSI14_norm', 'New_high50',
        'ATR_pct_norm', 'bullish_score'
    ]
    df_clean = df[cols_to_keep].copy()
    return df_clean

# ---------- Process all tickers incrementally ----------

def compute_all_tickers():
    tickers_last_rows = []

    for file in os.listdir(RAW_PARQUET_ROOT):
        if not file.endswith(".parquet"):
            continue
        
        ticker = os.path.splitext(file)[0].upper()
        raw_path = os.path.join(RAW_PARQUET_ROOT, file)
        indicator_path = os.path.join(INDICATORS_ROOT, file)
        
        # Load raw OHLCV
        df_raw = pd.read_parquet(raw_path)
        df_raw['timestamp'] = pd.to_datetime(df_raw['timestamp'])
        
        # Load existing indicators if exists
        if os.path.exists(indicator_path):
            df_indicators = pd.read_parquet(indicator_path)
            df_indicators['timestamp'] = pd.to_datetime(df_indicators['timestamp'])
            last_ts = df_indicators['timestamp'].max()
            
            # Filter only **new raw rows**
            df_new = df_raw[df_raw['timestamp'] > last_ts]
            if not df_new.empty:
                df_new_ind = calculate_indicators_and_score(df_new)
                df_combined = pd.concat([df_indicators, df_new_ind], ignore_index=True)
            else:
                df_combined = df_indicators.copy()
        else:
            # No previous indicators, compute for all
            df_combined = calculate_indicators_and_score(df_raw)
        
        df_combined['date'] = df_combined['timestamp'].dt.strftime('%Y-%m-%d')
        # Deduplicate just in case
        df_combined.drop_duplicates(subset=['timestamp'], inplace=True)
        df_combined.sort_values('timestamp', inplace=True)
        df_combined.reset_index(drop=True, inplace=True)
        
        # Save indicators
        atomic_parquet_write(df_combined, indicator_path)
        
        # Collect last row for today ranking
        last_row = df_combined.iloc[-1].copy()
        last_row['ticker'] = ticker
        tickers_last_rows.append(last_row)
        
        print(f"Processed {ticker}: {len(df_combined)} rows (incremental)")

    # ---------- Create today’s bullish score file ----------
    df_today = pd.DataFrame(tickers_last_rows)
    df_today = df_today.sort_values('bullish_score', ascending=False).reset_index(drop=True)

    atomic_parquet_write(df_today, TODAY_BULLISH_PATH)
    print(f"Today’s bullish ranking saved → {TODAY_BULLISH_PATH}")

if __name__ == "__main__":
    print("Starting indicators + bullish score computation...")
    compute_all_tickers()
    print("Done.")
