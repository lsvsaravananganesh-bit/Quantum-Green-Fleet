"""
Advanced Fleet Intelligence API Router.
Handles Multi-Depot Operations, Fuel Anomalies, and Driver Eco-Scores.
"""
from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user
from app.optimization.fleet_intelligence import get_intelligence_engine

router = APIRouter(prefix="/api/intelligence", tags=["Fleet Intelligence"])


@router.get("/overview")
def get_fleet_intelligence_overview(current_user=Depends(get_current_user)):
    engine = get_intelligence_engine()
    try:
        report = engine.generate_intelligence_report()
        return report.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Intelligence overview generation failed: {str(e)}")
