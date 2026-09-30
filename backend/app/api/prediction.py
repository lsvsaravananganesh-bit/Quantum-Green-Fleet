"""
Prediction API endpoints - connects ML predictor to FastAPI.
"""
import json
import os
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.ml.predictor import get_predictor
from app.ml.trainer import compute_feature_importance
from app.models.prediction import PredictionRecord
from app.schemas.prediction import PredictionRequest, PredictionResponse, ModelsMetricsResponse, ModelMetrics

router = APIRouter(tags=["Prediction"])

MODELS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "models")
)


@router.post("/api/predict/fuel", response_model=PredictionResponse)
def predict_fuel(
    request: PredictionRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    predictor = get_predictor()
    if not predictor.is_loaded():
        raise HTTPException(
            status_code=503,
            detail="ML model not available. Run 'python scripts/train_models.py' first.",
        )

    result = predictor.predict(request.model_dump())

    # Save prediction to DB
    record = PredictionRecord(
        vehicle_id=request.vehicle_id,
        model_version=result["model_version"],
        model_name=result["model_name"],
        input_features_json=json.dumps(request.model_dump()),
        predicted_fuel_liters=result["predicted_fuel_liters"],
        predicted_efficiency_kmpl=result["predicted_efficiency_kmpl"],
        predicted_cost_inr=result["predicted_cost_inr"],
        predicted_co2_kg=result["predicted_co2_kg"],
        confidence_lower=result["confidence_lower"],
        confidence_upper=result["confidence_upper"],
        distance_km=request.distance_km,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return PredictionResponse(
        prediction_id=record.id,
        **result,
    )


@router.post("/api/predict/batch")
def batch_predict(
    requests: list[PredictionRequest],
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    predictor = get_predictor()
    if not predictor.is_loaded():
        raise HTTPException(status_code=503, detail="ML model not available")

    results = []
    for req in requests[:50]:  # limit batch size
        result = predictor.predict(req.model_dump())
        results.append(result)
    return {"predictions": results, "count": len(results)}


@router.get("/api/predict/history")
def get_prediction_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(PredictionRecord).order_by(PredictionRecord.created_at.desc())
    total = q.count()
    records = q.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "data": [
            {
                "id": r.id,
                "vehicle_id": r.vehicle_id,
                "model_name": r.model_name,
                "predicted_fuel_liters": r.predicted_fuel_liters,
                "predicted_cost_inr": r.predicted_cost_inr,
                "predicted_co2_kg": r.predicted_co2_kg,
                "distance_km": r.distance_km,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in records
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/api/models/metrics", response_model=ModelsMetricsResponse)
def get_model_metrics(current_user=Depends(get_current_user)):
    metrics_path = os.path.join(MODELS_DIR, "metrics.json")
    if not os.path.exists(metrics_path):
        return ModelsMetricsResponse(
            models=[],
            best_model="none",
            training_date=None,
            dataset_size=None,
        )

    with open(metrics_path) as f:
        data = json.load(f)

    models_list = []
    for name, info in data.get("models", {}).items():
        test = info.get("test", {})
        models_list.append(ModelMetrics(
            model_name=name,
            mae=test.get("mae", 0),
            rmse=test.get("rmse", 0),
            r2=test.get("r2", 0),
            mape=test.get("mape", 0),
            is_selected=info.get("is_selected", False),
        ))

    best = data.get("best_model", "none")
    best_model_info = data.get("models", {}).get(best, {})
    test_r2 = best_model_info.get("test", {}).get("r2")

    return ModelsMetricsResponse(
        models=models_list,
        best_model=best,
        training_date=data.get("training_date"),
        dataset_size=data.get("dataset_size"),
        test_r2=test_r2,
    )
