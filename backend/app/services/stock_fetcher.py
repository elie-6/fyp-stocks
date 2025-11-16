import pandas as pd
import yfinance as yf

def fetch_stock_data(ticker: str, start=None, end=None) -> pd.DataFrame:
    df = yf.download(ticker, start=start, end=end)
    if df.empty:
        return pd.DataFrame()

    df = df.reset_index()  # 'Date' becomes a column

    # Flatten MultiIndex columns
    if isinstance(df.columns, pd.MultiIndex):
       df.columns = ['_'.join(filter(None, col)).strip() for col in df.columns.values]


    return df
