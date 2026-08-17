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
    Fetches order item activity with timestamp of order creation and aggregate counts.
    """
    cursor.execute("""
        SELECT 
            oi.product_id,
            COALESCE(oi.quantity, 1) AS quantity,
            o.created_at AS order_time,
            oi.order_id
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

    # 1. Calculate Total Purchasing Count, Order Frequency & Velocity Decay
    total_purchased = {}      # Total quantity purchased
    order_sets = {}           # Set of distinct orders
    recent_velocity = {}      # Time-decayed velocity score

    for row in order_rows:
        pid = str(row["product_id"])
        qty = int(row["quantity"])
        order_id = str(row.get("order_id", ""))
        order_time = row["order_time"]

        # Accumulate lifetime purchase quantity & distinct order count
        total_purchased[pid] = total_purchased.get(pid, 0) + qty
        if pid not in order_sets:
            order_sets[pid] = set()
        if order_id:
            order_sets[pid].add(order_id)

        # Exponential time decay for recent sales momentum (half-life ~14 days)
        if order_time:
            if order_time.tzinfo is None:
                order_time = order_time.replace(tzinfo=timezone.utc)
            days_ago = max(0.0, (now - order_time).total_seconds() / 86400.0)
        else:
            days_ago = 30.0

        decay = math.exp(-0.05 * days_ago)
        recent_velocity[pid] = recent_velocity.get(pid, 0.0) + (qty * 3.5 * decay)

    # 2. Calculate Active Cart Interest
    cart_scores = {}
    for row in cart_rows:
        pid = str(row["product_id"])
        qty = int(row["quantity"])
        cart_time = row["cart_time"]

        if cart_time:
            if cart_time.tzinfo is None:
                cart_time = cart_time.replace(tzinfo=timezone.utc)
            days_ago = max(0.0, (now - cart_time).total_seconds() / 86400.0)
        else:
            days_ago = 5.0

        decay = math.exp(-0.10 * days_ago)
        cart_scores[pid] = cart_scores.get(pid, 0.0) + (qty * 2.0 * decay)

    scored_products = []

    for product in all_products:
        pid_str = str(product["id"])
        compat_models = compat_map.get(pid_str, [])

        # If vehicle_model_id is specified, filter for compatible vehicles
        if vehicle_model_id:
            model_ids = {m["id"] for m in compat_models}
            if vehicle_model_id not in model_ids:
                continue

        purchases = total_purchased.get(pid_str, 0)
        orders_count = len(order_sets.get(pid_str, set()))
        velocity = recent_velocity.get(pid_str, 0.0)
        cart_demand = cart_scores.get(pid_str, 0.0)

        # Factor 1: Purchasing Count & Volume (High Weight)
        purchase_volume_score = math.log1p(purchases) * 3.5 + math.log1p(orders_count) * 2.0

        # Factor 2: Customer Rating (Satisfied buyers)
        rating = float(product["rating"]) if product["rating"] is not None else 0.0
        rating_score = (rating / 5.0) * 3.0

        # Factor 3: Recent Sales Velocity + Cart Interest
        momentum_score = velocity + cart_demand

        # Factor 4: Stock Availability Boost
        stock_bonus = 1.5 if product["available_quantity"] > 0 else 0.0

        total_trending_score = (
            purchase_volume_score +
            momentum_score +
            rating_score +
            stock_bonus
        )

        # Generate customer-friendly badge/reason (Zero technical jargon)
        if purchases >= 5 and rating >= 4.5:
            reason = f"Best Seller • {rating:.1f}★ Top Rated"
        elif purchases >= 3:
            reason = f"Best Seller • {purchases} Purchased"
        elif rating >= 4.5:
            reason = f"Top Rated • {rating:.1f}★ Choice"
        elif orders_count >= 1:
            reason = "High Demand • Popular Choice"
        elif product["available_quantity"] > 0:
            reason = "Trending BMW Genuine Part"
        else:
            reason = "Popular BMW OEM Part"

        scored_products.append((total_trending_score, product, compat_models, reason))

    # Sort descending by trending score
    scored_products.sort(key=lambda x: x[0], reverse=True)

    top_results = scored_products[:limit]
    max_score = top_results[0][0] if top_results and top_results[0][0] > 0 else 1.0

    return [
        build_product_dto(
            prod,
            comp,
            score=min(round(score / max(max_score, 1.0), 3), 0.99),
            match_reason=reason
        )
        for score, prod, comp, reason in top_results
    ]

