from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.fuel import FuelRecord
from app.models.optimization import OptimizationRun
from app.models.prediction import Alert

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary")
def get_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    total_vehicles = db.query(Vehicle).filter(Vehicle.is_active == True).count()
    active_vehicles = db.query(Vehicle).filter(
        Vehicle.is_active == True, Vehicle.status == "in_use"
    ).count()
    available_vehicles = db.query(Vehicle).filter(
        Vehicle.is_active == True, Vehicle.status == "available"
    ).count()
    total_trips = db.query(Trip).count()
    completed_trips = db.query(Trip).filter(Trip.status == "completed").count()
    active_trips = db.query(Trip).filter(Trip.status == "active").count()

    # Fuel stats from completed trips
    fuel_stats = db.query(
        func.sum(Trip.actual_fuel_liters).label("total_fuel"),
        func.avg(Trip.actual_fuel_liters).label("avg_fuel"),
        func.sum(Trip.fuel_cost_inr).label("total_cost"),
        func.sum(Trip.co2_emissions_kg).label("total_co2"),
        func.avg(Trip.distance_km / func.nullif(Trip.actual_fuel_liters, 0)).label("avg_eff"),
    ).filter(
        Trip.status == "completed",
        Trip.actual_fuel_liters != None,
    ).first()

    total_fuel = round(fuel_stats.total_fuel or 0, 2)
    avg_fuel = round(fuel_stats.avg_fuel or 0, 2)
    total_cost = round(fuel_stats.total_cost or 0, 2)
    total_co2 = round(fuel_stats.total_co2 or 0, 2)
    avg_efficiency = round(fuel_stats.avg_eff or 0, 2)

    optimization_runs = db.query(OptimizationRun).filter(
        OptimizationRun.status == "completed"
    ).count()

    active_alerts = db.query(Alert).filter(
        Alert.is_read == 0, Alert.is_resolved == 0
    ).count()

    utilization = round((active_vehicles / total_vehicles * 100) if total_vehicles > 0 else 0, 1)

    return {
        "total_vehicles": total_vehicles,
        "active_vehicles": active_vehicles,
        "available_vehicles": available_vehicles,
        "total_trips": total_trips,
        "completed_trips": completed_trips,
        "active_trips": active_trips,
        "avg_fuel_consumption": avg_fuel,
        "total_fuel_consumed": total_fuel,
        "total_fuel_cost_inr": total_cost,
        "avg_efficiency_kmpl": avg_efficiency,
        "total_co2_emissions_kg": total_co2,
        "optimization_runs": optimization_runs,
        "vehicle_utilization_pct": utilization,
        "active_alerts": active_alerts,
    }


@router.get("/fuel-trends")
def get_fuel_trends(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    cutoff = datetime.utcnow() - timedelta(days=days)
    # Group completed trips by date
    trips = db.query(Trip).filter(
        Trip.status == "completed",
        Trip.actual_arrival >= cutoff,
        Trip.actual_fuel_liters != None,
    ).all()

    daily = {}
    for t in trips:
        if t.actual_arrival:
            day = t.actual_arrival.strftime("%Y-%m-%d")
            if day not in daily:
                daily[day] = {"date": day, "fuel_liters": 0, "cost_inr": 0, "trips": 0, "co2_kg": 0}
            daily[day]["fuel_liters"] += t.actual_fuel_liters or 0
            daily[day]["cost_inr"] += t.fuel_cost_inr or 0
            daily[day]["trips"] += 1
            daily[day]["co2_kg"] += t.co2_emissions_kg or 0

    result = sorted(daily.values(), key=lambda x: x["date"])
    return {"trends": result, "days": days}


@router.get("/emissions")
def get_emissions(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    trips = db.query(Trip).filter(
        Trip.status == "completed",
        Trip.co2_emissions_kg != None,
    ).all()

    by_type: dict = {}
    for t in trips:
        if t.vehicle_id:
            v = db.query(Vehicle).filter(Vehicle.id == t.vehicle_id).first()
            vtype = v.vehicle_type if v else "unknown"
        else:
            vtype = "unknown"
        if vtype not in by_type:
            by_type[vtype] = 0
        by_type[vtype] += t.co2_emissions_kg or 0

    return {
        "by_vehicle_type": [
            {"vehicle_type": k, "co2_kg": round(v, 2)}
            for k, v in by_type.items()
        ],
        "total_co2_kg": round(sum(by_type.values()), 2),
    }


@router.get("/fleet-performance")
def get_fleet_performance(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    vehicles = db.query(Vehicle).filter(Vehicle.is_active == True).all()
    result = []
    for v in vehicles:
        completed = db.query(Trip).filter(
            Trip.vehicle_id == v.id,
            Trip.status == "completed",
            Trip.actual_fuel_liters != None,
            Trip.distance_km != None,
        ).all()
        if completed:
            total_dist = sum(t.distance_km for t in completed)
            total_fuel = sum(t.actual_fuel_liters for t in completed)
            efficiency = round(total_dist / total_fuel, 2) if total_fuel > 0 else 0
            result.append({
                "vehicle_id": v.id,
                "registration_number": v.registration_number,
                "vehicle_type": v.vehicle_type,
                "fuel_type": v.fuel_type,
                "total_trips": len(completed),
                "total_distance_km": round(total_dist, 1),
                "total_fuel_liters": round(total_fuel, 2),
                "avg_efficiency_kmpl": efficiency,
            })
    result.sort(key=lambda x: x["avg_efficiency_kmpl"], reverse=True)
    return {"vehicles": result}
