"""
Adaptive Machine Learning, Feature Drift & Model Registry API Router.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.security import get_current_user
from app.ml.drift_monitor import get_drift_monitor

router = APIRouter(prefix="/api/ml-drift", tags=["Adaptive ML & Drift"])


class PromoteModelRequest(BaseModel):
    version_id: str


@router.get("/report")
def get_ml_drift_report(current_user=Depends(get_current_user)):
    monitor = get_drift_monitor()
    try:
        report = monitor.generate_drift_report()
        return report.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate drift report: {str(e)}")


@router.post("/promote")
def promote_champion_model(
    request: PromoteModelRequest,
    current_user=Depends(get_current_user),
):
    monitor = get_drift_monitor()
    res = monitor.promote_model(request.version_id)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res


@router.post("/rollback")
def rollback_champion_model(current_user=Depends(get_current_user)):
    monitor = get_drift_monitor()
    res = monitor.rollback_model()
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res
