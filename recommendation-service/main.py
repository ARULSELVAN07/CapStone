from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.similar import router as similar_router
from routers.trending import router as trending_router
from ml.experiments import router as experiments_router
from database import get_connection_pool

app = FastAPI(
    title="BMW SpareHub Recommendation Service",
    description="Python microservice providing ML-powered Similar Products and Trending Products recommendations for BMW SpareHub.",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(similar_router)
app.include_router(trending_router)
app.include_router(experiments_router)

@app.get("/")
def root():
    return {
        "service": "BMW SpareHub Recommendation Service",
        "status": "online",
        "version": "1.0.0",
        "endpoints": [
            "/health",
            "/recommendations/similar/{product_id}",
            "/recommendations/trending"
        ]
    }

@app.get("/health")
def health_check():
    try:
        pool = get_connection_pool()
        conn = pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                cur.fetchone()
            return {"status": "UP", "database": "CONNECTED"}
        finally:
            pool.putconn(conn)
    except Exception as e:
        return {"status": "DEGRADED", "database_error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
