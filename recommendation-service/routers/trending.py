import math
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Query
from psycopg2.extras import RealDictCursor
from database import get_db
from routers.similar import (
    fetch_all_active_products,
    fetch_compatibility_map,
    build_product_dto
)

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

def fetch_order_activity(cursor):
    """
    Fetches order item activity with timestamp of order creation.
    """
    cursor.execute("""
        SELECT 
            oi.product_id,
            COALESCE(oi.quantity, 1) AS quantity,
            o.created_at AS order_time
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status NOT IN ('CANCELLED')
    """)
    return cursor.fetchall()

def fetch_cart_activity(cursor):
    """
    Fetches items currently in active user carts.
    """
    cursor.execute("""
        SELECT 
            ci.product_id,
            COALESCE(ci.quantity, 1) AS quantity,
            ci.updated_at AS cart_time
        FROM cart_items ci
    """)
    return cursor.fetchall()

@router.get("/trending")
def get_trending_products(
    limit: int = Query(10, ge=1, le=50),
    vehicle_model_id: Optional[str] = Query(None)
):
    now = datetime.now(timezone.utc)

    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            all_products = fetch_all_active_products(cur)
            compat_map = fetch_compatibility_map(cur)
            order_rows = fetch_order_activity(cur)
            cart_rows = fetch_cart_activity(cur)

    # Calculate Order Scores with Exponential Time Decay
    # Half-life = ~14 days (lambda = 0.05)
    order_scores = {}
    for row in order_rows:
        pid = str(row["product_id"])
        qty = row["quantity"]
        order_time = row["order_time"]
        
        if order_time:
            if order_time.tzinfo is None:
                order_time = order_time.replace(tzinfo=timezone.utc)
            days_ago = max(0.0, (now - order_time).total_seconds() / 86400.0)
        else:
            days_ago = 30.0

        decay = math.exp(-0.05 * days_ago)
        activity_value = qty * 4.0 * decay
        order_scores[pid] = order_scores.get(pid, 0.0) + activity_value

    # Calculate Cart Scores (Active Demand)
    cart_scores = {}
    for row in cart_rows:
        pid = str(row["product_id"])
        qty = row["quantity"]
        cart_time = row["cart_time"]

        if cart_time:
            if cart_time.tzinfo is None:
                cart_time = cart_time.replace(tzinfo=timezone.utc)
            days_ago = max(0.0, (now - cart_time).total_seconds() / 86400.0)
        else:
            days_ago = 5.0

        decay = math.exp(-0.10 * days_ago)
        cart_val = qty * 2.5 * decay
        cart_scores[pid] = cart_scores.get(pid, 0.0) + cart_val

    scored_products = []

    for product in all_products:
        pid_str = str(product["id"])
        compat_models = compat_map.get(pid_str, [])

        # If vehicle_model_id is specified, filter or heavily score matching vehicles
        if vehicle_model_id:
            model_ids = {m["id"] for m in compat_models}
            if vehicle_model_id not in model_ids:
                continue

        rating = float(product["rating"]) if product["rating"] is not None else 0.0
        rating_score = (rating / 5.0) * 3.0  # up to 3 points from rating

        order_val = order_scores.get(pid_str, 0.0)
        cart_val = cart_scores.get(pid_str, 0.0)

        # Baseline score: if product has few orders yet, rating and availability ensure balanced baseline
        base_popularity = rating_score

        # Stock availability factor: available products get higher priority
        stock_bonus = 1.0 if product["available_quantity"] > 0 else 0.0

        total_trending_score = order_val + cart_val + base_popularity + stock_bonus

        scored_products.append((total_trending_score, product, compat_models))

    # Sort descending by trending score
    scored_products.sort(key=lambda x: x[0], reverse=True)

    top_results = scored_products[:limit]
    max_score = top_results[0][0] if top_results and top_results[0][0] > 0 else 1.0

    return [
        build_product_dto(
            prod,
            comp,
            score=min(round(score / max(max_score, 1.0), 3), 0.99),
            match_reason=f"Popularity Index {round(score, 1)} pts"
        )
        for score, prod, comp in top_results
    ]

