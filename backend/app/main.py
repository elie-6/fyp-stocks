from fastapi import FastAPI

app = FastAPI(title="Stock Search API (sanity-check)")

@app.get("/api/health")
def health():
    return {"status": "ok"}
