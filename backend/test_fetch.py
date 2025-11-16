from app.services.stock_fetcher import fetch_stock_data

df = fetch_stock_data("TSLA", start="2024-01-01", end="2024-02-01")
print(df.head())
print(df.columns)
