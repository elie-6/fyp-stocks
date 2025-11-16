from fastapi import FastAPI

from app.routes import stocks

app = FastAPI(title="Stock Search API")

app.include_router(stocks.router, prefix="/stocks", tags=["stocks"])

@app.get("/api/health")
def health():
    return {"status": "ok"}
