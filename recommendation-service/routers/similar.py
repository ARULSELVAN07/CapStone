import re
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from psycopg2.extras import RealDictCursor
from database import get_db

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

STOPWORDS = {"bmw", "oem", "genuine", "set", "the", "for", "and", "with", "a", "an", "in", "of"}

def extract_keywords(text: str) -> set:
    if not text:
        return set()
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    return {w for w in words if w not in STOPWORDS}

def fetch_product_details(cursor, product_id: str):
    cursor.execute("""
        SELECT 
            p.id, p.category_id, p.part_number, p.name, p.description, 
            p.brand, p.price, p.warranty_months, p.image_url, p.rating, p.status,
            c.id AS cat_id, c.name AS cat_name, c.description AS cat_desc, c.active AS cat_active,
            COALESCE(i.available_quantity, 0) AS available_quantity,
            COALESCE(i.reserved_quantity, 0) AS reserved_quantity,
            COALESCE(i.minimum_stock_threshold, 5) AS minimum_stock_threshold
        FROM products p
        JOIN categories c ON p.category_id = c.id
        LEFT JOIN inventory i ON p.id = i.product_id
        WHERE p.id = %s
    """, (product_id,))
    return cursor.fetchone()

def fetch_all_active_products(cursor):
    cursor.execute("""
        SELECT 
            p.id, p.category_id, p.part_number, p.name, p.description, 
            p.brand, p.price, p.warranty_months, p.image_url, p.rating, p.status,
            c.id AS cat_id, c.name AS cat_name, c.description AS cat_desc, c.active AS cat_active,
            COALESCE(i.available_quantity, 0) AS available_quantity,
            COALESCE(i.reserved_quantity, 0) AS reserved_quantity,
            COALESCE(i.minimum_stock_threshold, 5) AS minimum_stock_threshold
        FROM products p
        JOIN categories c ON p.category_id = c.id
        LEFT JOIN inventory i ON p.id = i.product_id
        WHERE p.status = 'ACTIVE'
    """)
    return cursor.fetchall()

def fetch_compatibility_map(cursor):
    cursor.execute("""
        SELECT 
            pc.product_id,
            vm.id AS model_id,
            vm.model_name,
            vm.model_code,
            vm.model_year,
            vm.engine_type,
            vm.fuel_type
        FROM part_compatibility pc
        JOIN vehicle_models vm ON pc.vehicle_model_id = vm.id
    """)
    rows = cursor.fetchall()
    compat_map = {}
    for row in rows:
        pid = str(row["product_id"])
        if pid not in compat_map:
            compat_map[pid] = []
        compat_map[pid].append({
            "id": str(row["model_id"]),
            "modelName": row["model_name"],
            "modelCode": row["model_code"],
            "modelYear": row["model_year"],
            "engineType": row["engine_type"],
            "fuelType": row["fuel_type"]
        })
    return compat_map

def calculate_stock_status(available: int, threshold: int) -> str:
    if available <= 0:
        return "OUT_OF_STOCK"
    elif available <= threshold:
        return "LOW_STOCK"
    return "IN_STOCK"

def build_product_dto(prod_row, compat_models: list, score: float = 0.0, match_reason: str = "", match_factors: dict = None) -> dict:
    available = prod_row["available_quantity"]
    threshold = prod_row["minimum_stock_threshold"]
    return {
        "id": str(prod_row["id"]),
        "category": {
            "id": str(prod_row["cat_id"]),
            "name": prod_row["cat_name"],
            "description": prod_row["cat_desc"],
            "active": prod_row["cat_active"]
        },
        "partNumber": prod_row["part_number"],
        "name": prod_row["name"],
        "description": prod_row["description"],
        "brand": prod_row["brand"],
        "price": float(prod_row["price"]) if prod_row["price"] is not None else 0.0,
        "warrantyMonths": prod_row["warranty_months"],
        "imageUrl": prod_row["image_url"],
        "rating": float(prod_row["rating"]) if prod_row["rating"] is not None else 0.0,
        "status": prod_row["status"],
        "availableQuantity": available,
        "stockStatus": calculate_stock_status(available, threshold),
        "compatibleModels": compat_models,
        "recommendationScore": round(score, 3),
        "matchReason": match_reason,
        "matchFactors": match_factors or {
            "vehicleCompatibility": 95.0 if compat_models else 70.0,
            "specificationMatch": 85.0,
            "brandMatch": 100.0,
            "priceValue": 88.0,
            "customerRating": round((float(prod_row["rating"] or 4.5) / 5.0) * 100.0, 1)
        }
    }

@router.get("/similar/{product_id}")
def get_similar_products(
    product_id: str,
    vehicle_model_id: Optional[str] = Query(None),
    limit: int = Query(6, ge=1, le=20)
):
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            base_prod = fetch_product_details(cur, product_id)
            if not base_prod:
                raise HTTPException(status_code=404, detail="Product not found")

            all_products = fetch_all_active_products(cur)
            compat_map = fetch_compatibility_map(cur)

    # Execute Scikit-Learn TF-IDF + Cosine Similarity ML Inference
    from ml.recommender import ml_recommender
    ml_results = ml_recommender.predict_similar(
        base_product_id=product_id,
        products=all_products,
        compat_map=compat_map,
        vehicle_model_id=vehicle_model_id,
        limit=limit
    )

    return [
        build_product_dto(prod, comp, score=score, match_reason=reason, match_factors=factors)
        for score, prod, comp, reason, factors in ml_results
    ]

