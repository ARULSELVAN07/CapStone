import numpy as np
from fastapi import APIRouter
from psycopg2.extras import RealDictCursor
from database import get_db
from ml.recommender import ml_recommender
from routers.similar import fetch_all_active_products, fetch_compatibility_map

router = APIRouter(prefix="/recommendations/experiments", tags=["ml-experiments"])

@router.get("/evaluation")
def get_model_evaluation():
    """
    Returns evaluation metrics, matrix statistics, and NLP vocabulary diagnostics
    for the Scikit-Learn TF-IDF + Cosine Similarity recommendation model.
    """
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            products = fetch_all_active_products(cur)
            compat_map = fetch_compatibility_map(cur)

    # Ensure model is fitted
    ml_recommender.fit(products, compat_map)

    tfidf = ml_recommender.tfidf_matrix
    sim_matrix = ml_recommender.tfidf_sim_matrix
    feature_names = ml_recommender.vectorizer.get_feature_names_out()
    idf_scores = ml_recommender.vectorizer.idf_

    # Top discriminating terms by IDF score
    top_indices = np.argsort(idf_scores)[::-1][:25]
    top_terms = [{"term": feature_names[i], "idf": float(idf_scores[i])} for i in top_indices]

    # Matrix Sparsity Calculation
    non_zeros = tfidf.nnz
    total_elements = tfidf.shape[0] * tfidf.shape[1]
    sparsity = (1.0 - (non_zeros / total_elements)) * 100.0 if total_elements > 0 else 0.0

    # Non-diagonal similarity values (pairwise similarity across distinct products)
    n = sim_matrix.shape[0]
    off_diag_mask = ~np.eye(n, dtype=bool)
    off_diag_sims = sim_matrix[off_diag_mask]

    sim_stats = {
        "mean_cosine_similarity": float(np.mean(off_diag_sims)) if len(off_diag_sims) > 0 else 0.0,
        "median_cosine_similarity": float(np.median(off_diag_sims)) if len(off_diag_sims) > 0 else 0.0,
        "max_cosine_similarity": float(np.max(off_diag_sims)) if len(off_diag_sims) > 0 else 0.0,
        "std_dev_cosine_similarity": float(np.std(off_diag_sims)) if len(off_diag_sims) > 0 else 0.0,
        "p75_cosine_similarity": float(np.percentile(off_diag_sims, 75)) if len(off_diag_sims) > 0 else 0.0
    }

    return {
        "model_architecture": "Hybrid Scikit-Learn TF-IDF + Vehicle Compatibility Tensor Recommender",
        "vectorizer_config": {
            "ngram_range": [1, 2],
            "sublinear_tf": True,
            "stop_words": "english",
            "vocabulary_size": len(feature_names)
        },
        "dataset_metrics": {
            "total_products_indexed": len(products),
            "total_vehicle_models": len(ml_recommender.all_model_ids),
            "feature_matrix_shape": list(tfidf.shape),
            "matrix_sparsity_percent": round(sparsity, 2),
            "non_zero_features": non_zeros
        },
        "similarity_distribution": sim_stats,
        "top_discriminating_features": top_terms,
        "feature_weights": {
            "bmw_vehicle_compatibility": 0.40,
            "tfidf_nlp_similarity": 0.30,
            "brand_consistency": 0.15,
            "price_proximity": 0.10,
            "product_rating": 0.05
        }
    }
