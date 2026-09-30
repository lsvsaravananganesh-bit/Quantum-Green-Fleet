"""Optimization API endpoints."""
import json
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.optimization import OptimizationRun
from app.models.vehicle import Vehicle
from app.models.trip import Trip
from app.optimization.fleet_optimizer import get_optimizer
from app.optimization.qubo_formulator import VehicleInfo, TripInfo
from app.schemas.prediction import OptimizationRequest, OptimizationResponse, TripAssignment

router = APIRouter(prefix="/api/optimization", tags=["Optimization"])


def vehicle_to_info(v: Vehicle) -> VehicleInfo:
    return VehicleInfo(
        id=v.id,
        registration_number=v.registration_number,
        vehicle_type=v.vehicle_type,
        fuel_type=v.fuel_type,
        weight_kg=v.weight_kg or 1500.0,
        engine_cc=v.engine_cc or 1500.0,
        baseline_mileage_kmpl=v.baseline_mileage_kmpl or 15.0,
        is_available=v.status == "available",
        vehicle_age=2026 - (v.year or 2020),
    )


def trip_to_info(t: Trip) -> TripInfo:
    return TripInfo(
        id=t.id,
        trip_code=t.trip_code,
        origin=t.origin,
        destination=t.destination,
        distance_km=t.distance_km,
        payload_kg=t.payload_kg or 0.0,
        traffic_condition=t.traffic_condition or "medium",
        road_type=t.road_type or "mixed",
    )


@router.post("/run", response_model=OptimizationResponse)
def run_optimization(
    request: OptimizationRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Load vehicles
    vq = db.query(Vehicle).filter(Vehicle.is_active == True)
    if request.vehicle_ids:
        vq = vq.filter(Vehicle.id.in_(request.vehicle_ids))
    vehicles_db = vq.all()

    # Load trips
    tq = db.query(Trip).filter(Trip.status.in_(["planned", "active"]))
    if request.trip_ids:
        tq = tq.filter(Trip.id.in_(request.trip_ids))
    trips_db = tq.limit(30).all()  # limit for performance

    if not vehicles_db or not trips_db:
        raise HTTPException(
            status_code=400,
            detail="Need available vehicles and planned trips to optimize",
        )

    vehicles = [vehicle_to_info(v) for v in vehicles_db]
    trips = [trip_to_info(t) for t in trips_db]

    # Save run record
    run = OptimizationRun(
        run_name=request.run_name,
        algorithm=request.algorithm,
        status="running",
        num_trips=len(trips),
        num_vehicles=len(vehicles),
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    try:
        optimizer = get_optimizer()
        result = optimizer.optimize(
            vehicles=vehicles,
            trips=trips,
            algorithm=request.algorithm,
            run_name=request.run_name,
            objective_weights=request.objective_weights,
        )

        # Update run record
        run.status = "completed"
        run.objective_value = result.objective_value
        run.total_fuel_cost_inr = result.total_fuel_cost_inr
        run.total_emissions_kg = result.total_emissions_kg
        run.total_fuel_liters = result.total_fuel_liters
        run.computation_time_ms = result.computation_time_ms
        run.is_feasible = 1 if result.is_feasible else 0
        run.results_json = json.dumps(result.to_dict(), default=str)
        db.commit()

        assignments = [
            TripAssignment(
                trip_id=a.trip_id,
                trip_code=a.trip_code,
                origin=a.origin,
                destination=a.destination,
                distance_km=a.distance_km,
                vehicle_id=a.vehicle_id,
                registration_number=a.registration_number,
                vehicle_type=a.vehicle_type,
                predicted_fuel_liters=a.predicted_fuel_liters,
                fuel_cost_inr=a.fuel_cost_inr,
                co2_emissions_kg=a.co2_emissions_kg,
            )
            for a in result.assignments
        ]

        return OptimizationResponse(
            run_id=run.id,
            algorithm=result.algorithm,
            run_name=result.run_name,
            status="completed",
            total_fuel_liters=result.total_fuel_liters,
            total_fuel_cost_inr=result.total_fuel_cost_inr,
            total_emissions_kg=result.total_emissions_kg,
            objective_value=result.objective_value,
            computation_time_ms=result.computation_time_ms,
            num_trips=result.num_trips,
            num_vehicles=result.num_vehicles,
            is_feasible=result.is_feasible,
            assignments=assignments,
            constraint_violations=result.constraint_violations,
            created_at=run.created_at,
        )

    except Exception as e:
        run.status = "failed"
        run.error_message = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")


@router.get("/runs")
def list_runs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(OptimizationRun).order_by(OptimizationRun.created_at.desc())
    total = q.count()
    runs = q.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "data": [
            {
                "id": r.id,
                "run_name": r.run_name,
                "algorithm": r.algorithm,
                "status": r.status,
                "total_fuel_cost_inr": r.total_fuel_cost_inr,
                "total_emissions_kg": r.total_emissions_kg,
                "objective_value": r.objective_value,
                "computation_time_ms": r.computation_time_ms,
                "num_trips": r.num_trips,
                "is_feasible": bool(r.is_feasible),
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in runs
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/runs/{run_id}")
def get_run(
    run_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    run = db.query(OptimizationRun).filter(OptimizationRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    result = {
        "id": run.id,
        "run_name": run.run_name,
        "algorithm": run.algorithm,
        "status": run.status,
        "total_fuel_cost_inr": run.total_fuel_cost_inr,
        "total_emissions_kg": run.total_emissions_kg,
        "total_fuel_liters": run.total_fuel_liters,
        "objective_value": run.objective_value,
        "computation_time_ms": run.computation_time_ms,
        "num_trips": run.num_trips,
        "num_vehicles": run.num_vehicles,
        "is_feasible": bool(run.is_feasible),
        "created_at": run.created_at.isoformat() if run.created_at else None,
        "details": json.loads(run.results_json) if run.results_json else None,
    }
    return result


@router.post("/compare")
def compare_algorithms(
    request: OptimizationRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    vq = db.query(Vehicle).filter(Vehicle.is_active == True)
    if request.vehicle_ids:
        vq = vq.filter(Vehicle.id.in_(request.vehicle_ids))
    vehicles_db = vq.all()

    tq = db.query(Trip).filter(Trip.status.in_(["planned", "active"]))
    if request.trip_ids:
        tq = tq.filter(Trip.id.in_(request.trip_ids))
    trips_db = tq.limit(20).all()

    if not vehicles_db or not trips_db:
        raise HTTPException(status_code=400, detail="Need vehicles and trips")

    vehicles = [vehicle_to_info(v) for v in vehicles_db]
    trips = [trip_to_info(t) for t in trips_db]

    optimizer = get_optimizer()
    results = optimizer.compare_all(vehicles, trips)

    comparison = []
    for r in results:
        comparison.append({
            "algorithm": r.algorithm,
            "total_fuel_cost_inr": r.total_fuel_cost_inr,
            "total_emissions_kg": r.total_emissions_kg,
            "total_fuel_liters": r.total_fuel_liters,
            "objective_value": r.objective_value,
            "computation_time_ms": r.computation_time_ms,
            "is_feasible": r.is_feasible,
            "trips_assigned": len(r.assignments),
        })
    return {"comparison": comparison, "num_trips": len(trips), "num_vehicles": len(vehicles)}


@router.get("/scenarios")
def get_scenarios(current_user=Depends(get_current_user)):
    return {
        "scenarios": [
            {
                "id": "fuel_optimized",
                "name": "Fuel Cost Optimized",
                "description": "Minimize total fuel expenditure",
                "weights": {"fuel_cost": 0.9, "emissions": 0.1},
            },
            {
                "id": "emission_optimized",
                "name": "Emission Optimized",
                "description": "Minimize CO₂ emissions",
                "weights": {"fuel_cost": 0.2, "emissions": 0.8},
            },
            {
                "id": "balanced",
                "name": "Balanced (Cost + Emissions)",
                "description": "Equal weight on cost and emissions",
                "weights": {"fuel_cost": 0.5, "emissions": 0.5},
            },
            {
                "id": "utilization",
                "name": "Fleet Utilization",
                "description": "Maximize vehicle utilization",
                "weights": {"fuel_cost": 0.6, "emissions": 0.4},
            },
        ]
    }
