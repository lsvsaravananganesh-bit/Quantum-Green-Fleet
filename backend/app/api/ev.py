"""
Electric & Hybrid Fleet API Router.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, Field

from app.core.security import get_current_user
from app.optimization.ev_optimizer import get_ev_optimizer

router = APIRouter(prefix="/api/ev", tags=["Electric & Hybrid Fleet"])


class EVChargeScheduleRequest(BaseModel):
    vehicle_id: int = 1
    registration_number: str = "KA-03-EV-1001"
    battery_capacity_kwh: float = Field(75.0, ge=10.0, le=250.0)
    current_soc_pct: float = Field(25.0, ge=0.0, le=100.0)
    target_soc_pct: float = Field(85.0, ge=20.0, le=100.0)
    departure_time_hr: float = Field(7.5, ge=0.0, le=24.0)
    charger_power_kw: float = Field(22.0, ge=3.3, le=150.0)
    grid_emission_factor_g_kwh: float = Field(420.0, ge=50.0, le=900.0)


@router.get("/fleet-report")
def get_ev_fleet_report(
    ambient_temp_c: float = Query(28.0, ge=-10.0, le=50.0),
    grid_emission_factor_g_kwh: float = Query(420.0, ge=50.0, le=900.0),
    current_user=Depends(get_current_user),
):
    ev_opt = get_ev_optimizer()
    try:
        report = ev_opt.generate_fleet_report(
            ambient_temp_c=ambient_temp_c,
            grid_emission_factor_g_kwh=grid_emission_factor_g_kwh,
        )
        return report.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"EV analytics failed: {str(e)}")


@router.post("/charge-schedule")
def calculate_charge_schedule(
    request: EVChargeScheduleRequest,
    current_user=Depends(get_current_user),
):
    ev_opt = get_ev_optimizer()
    try:
        schedule = ev_opt.optimize_charging_schedule(
            vehicle_id=request.vehicle_id,
            registration_number=request.registration_number,
            battery_capacity_kwh=request.battery_capacity_kwh,
            current_soc_pct=request.current_soc_pct,
            target_soc_pct=request.target_soc_pct,
            departure_time_hr=request.departure_time_hr,
            charger_power_kw=request.charger_power_kw,
            grid_emission_factor_g_kwh=request.grid_emission_factor_g_kwh,
        )
        from dataclasses import asdict
        return asdict(schedule)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Charge scheduling failed: {str(e)}")
