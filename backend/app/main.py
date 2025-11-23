# backend/main.py
from fastapi import FastAPI,HTTPException
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware
import os
from app.routes import stocks  # your existing router
import numpy as np

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
TODAY_FILE = os.path.join(BASE_DIR, "today_bullish_scores", "parquet", "today_bullish_scores.parquet")
TICKER_DATA_DIR = os.path.join(BASE_DIR, "data", "parquet")  # folder containing {ticker}.parquet
TICKER_INDICATORS_DIR = os.path.join(BASE_DIR, "indicators", "parquet")  # folder containing {ticker}.parquet



app = FastAPI(title="Stock Search API")

# Include your existing stocks router
app.include_router(stocks.router, prefix="/stocks", tags=["stocks"])

# CORS for Vite frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "ok"}

def df_to_json_records_safe(df):
    """
    Converts a DataFrame into JSON-safe records:
    - Replaces inf/-inf with NaN
    - Converts NaN to None
    - Converts numpy scalars into native Python types
    """

    df = df.replace([np.inf, -np.inf], np.nan)

    records = []
    for row in df.to_dict(orient="records"):
        clean_row = {}
        for k, v in row.items():

            # Convert numpy scalar → Python scalar
            if isinstance(v, (np.generic,)):
                v = v.item()

            # Replace NaN/inf with None
            if isinstance(v, float):
                if np.isnan(v) or np.isinf(v):
                    clean_row[k] = None
                    continue

            clean_row[k] = v

        records.append(clean_row)

    return records


# ---------- New endpoint for today bullish scores ----------


@app.get("/api/today_bullish")
def get_today_bullish():

     # Debug: check path
    print("Looking for:", TODAY_FILE)
    print("Exists?", os.path.exists(TODAY_FILE))
    
    try:
        df = pd.read_parquet(TODAY_FILE)
        df['timestamp'] = df['timestamp'].astype(str)
        return df_to_json_records_safe(df)
    except FileNotFoundError:
        return {"error": "Bullish score file not found"}
    
@app.get("/api/ticker_history/{ticker}")
def get_ticker_history(ticker: str):
    file_path = os.path.join(TICKER_DATA_DIR, f"{ticker}.parquet")
    
    # Debug prints
    print("Looking for ticker file:", file_path)
    print("Exists?", os.path.exists(file_path))
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Ticker data not found")

    try:
        df = pd.read_parquet(file_path).sort_values("timestamp")
        df['timestamp'] = df['timestamp'].astype(str)
        # return full dataframe
        return df_to_json_records_safe(df)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/api/ticker_indicators/{ticker}")
def get_ticker_indicators(ticker: str):
    # Construct the path to the ticker's indicators parquet
    file_path = os.path.join(TICKER_INDICATORS_DIR, f"{ticker}.parquet")

    # Debug prints
    print("Looking for indicators file:", file_path)
    print("Exists?", os.path.exists(file_path))

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Ticker indicators not found")

    try:
        # Read the parquet file
        df = pd.read_parquet(file_path).sort_values("timestamp")
        df['timestamp'] = df['timestamp'].astype(str)
        return df_to_json_records_safe(df)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))