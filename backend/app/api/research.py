"""
Research Lab & Advanced Intelligence API Router.
Handles:
1. Multi-Objective Pareto Frontier Generation (Module 2)
2. Quantum-Inspired Benchmarking Lab (Module 3)
3. QUBO Matrix Visualizer & Decomposition (Module 4)
4. Robust Sensitivity & Risk Analysis (Module 7)
5. Validation Experiment Runner & Exports (Module 12)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.vehicle import Vehicle
from app.models.trip import Trip
from app.optimization.qubo_formulator import VehicleInfo, TripInfo
from app.optimization.multi_objective import get_multi_objective_optimizer
from app.optimization.benchmark_suite import get_benchmark_suite
from app.optimization.qubo_visualizer import get_qubo_visualizer
from app.optimization.robust_optimizer import get_robust_optimizer
from app.optimization.research_validator import get_research_validator

router = APIRouter(prefix="/api/research", tags=["Research & Advanced Optimization"])


def _get_fleet_entities(db: Session, max_vehicles: int = 8, max_trips: int = 8):
    v_db = db.query(Vehicle).filter(Vehicle.is_active == True).limit(max_vehicles).all()
    t_db = db.query(Trip).filter(Trip.status.in_(["planned", "active"])).limit(max_trips).all()

    vehicles = [
        VehicleInfo(
            id=v.id,
            registration_number=v.registration_number,
            vehicle_type=v.vehicle_type,
            fuel_type=v.fuel_type or "diesel",
            weight_kg=float(v.weight_kg or 1500.0),
            engine_cc=float(v.engine_cc or 1500.0),
            baseline_mileage_kmpl=float(v.baseline_mileage_kmpl or 14.0),
            is_available=v.status == "available",
            vehicle_age=2026 - (v.year or 2020),
        )
        for v in v_db
    ]

    trips = [
        TripInfo(
            id=t.id,
            trip_code=t.trip_code,
            origin=t.origin,
            destination=t.destination,
            distance_km=float(t.distance_km),
            payload_kg=float(t.payload_kg or 500.0),
            traffic_condition=t.traffic_condition or "medium",
            road_type=t.road_type or "mixed",
        )
        for t in t_db
    ]

    # Defaults if database is empty
    if not vehicles:
        vehicles = [
            VehicleInfo(1, "KA-01-TR-1001", "Heavy Truck", "diesel", 3500.0, 3200.0, 11.5, True, 3),
            VehicleInfo(2, "KA-02-EV-2002", "Electric Van", "electric", 1800.0, 0.0, 32.0, True, 1),
            VehicleInfo(3, "KA-03-HY-3003", "Hybrid Van", "hybrid", 2100.0, 1800.0, 18.0, True, 2),
            VehicleInfo(4, "KA-04-TR-4004", "Light Truck", "petrol", 2200.0, 2000.0, 13.0, True, 4),
        ]
    if not trips:
        trips = [
            TripInfo(1, "TRP-101", "Whitefield", "Electronic City", 45.0, 600.0, "medium", "urban"),
            TripInfo(2, "TRP-102", "Whitefield", "Koramangala", 32.0, 450.0, "high", "mixed"),
            TripInfo(3, "TRP-103", "Whitefield", "Peenya", 58.0, 800.0, "low", "highway"),
            TripInfo(4, "TRP-104", "Whitefield", "Indiranagar", 24.0, 350.0, "medium", "urban"),
        ]

    return vehicles, trips


# --- 1. Multi-Objective Pareto Request ---
class ParetoRequest(BaseModel):
    num_samples: int = Field(24, ge=10, le=50)


@router.post("/pareto")
def generate_pareto_front(
    request: ParetoRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    vehicles, trips = _get_fleet_entities(db, max_vehicles=6, max_trips=6)
    mo_optimizer = get_multi_objective_optimizer()
    try:
        res = mo_optimizer.generate_pareto_frontier(vehicles, trips, num_samples=request.num_samples)
        return res.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pareto optimization failed: {str(e)}")


# --- 2. Benchmarking Lab Request ---
class BenchmarkRequest(BaseModel):
    num_seeds: int = Field(5, ge=2, le=15)


@router.post("/benchmark")
def run_benchmark_lab(
    request: BenchmarkRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    vehicles, trips = _get_fleet_entities(db, max_vehicles=6, max_trips=6)
    bench_suite = get_benchmark_suite()
    try:
        res = bench_suite.run_benchmark(vehicles, trips, num_seeds=request.num_seeds)
        return res.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Benchmark execution failed: {str(e)}")


# --- 3. QUBO Matrix Visualizer Request ---
class QuboInspectRequest(BaseModel):
    lambda1: float = 500.0
    lambda2: float = 200.0
    lambda3: float = 1000.0
    alpha: float = 0.6
    beta: float = 0.4
    candidate_bitstring: Optional[str] = None


@router.post("/qubo-inspect")
def inspect_qubo_formulation(
    request: QuboInspectRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    vehicles, trips = _get_fleet_entities(db, max_vehicles=3, max_trips=3)
    visualizer = get_qubo_visualizer()
    try:
        analysis = visualizer.generate_visualization(
            vehicles=vehicles,
            trips=trips,
            lambda1=request.lambda1,
            lambda2=request.lambda2,
            lambda3=request.lambda3,
            alpha=request.alpha,
            beta=request.beta,
            candidate_bitstring=request.candidate_bitstring,
        )
        return analysis.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"QUBO matrix analysis failed: {str(e)}")


# --- 4. Robust Sensitivity Request ---
class SensitivityRequest(BaseModel):
    num_scenarios: int = Field(300, ge=50, le=1000)
    seed: int = 42


@router.post("/sensitivity")
def run_sensitivity_analysis(
    request: SensitivityRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    vehicles, trips = _get_fleet_entities(db, max_vehicles=6, max_trips=6)
    robust_opt = get_robust_optimizer()
    try:
        report = robust_opt.run_sensitivity_analysis(
            vehicles=vehicles,
            trips=trips,
            num_scenarios=request.num_scenarios,
            seed=request.seed,
        )
        return report.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sensitivity analysis failed: {str(e)}")


# --- 5. Research Validation Experiment Runner ---
class ExperimentRunRequest(BaseModel):
    title: str = "Quantum-Inspired vs Classical Fleet Optimization Experiment"
    num_seeds: int = 5


@router.post("/experiment-run")
def run_validation_experiment(
    request: ExperimentRunRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    vehicles, trips = _get_fleet_entities(db, max_vehicles=6, max_trips=6)
    validator = get_research_validator()
    try:
        exp_res = validator.run_validation_experiment(
            vehicles=vehicles,
            trips=trips,
            num_seeds=request.num_seeds,
            experiment_title=request.title,
        )
        return exp_res.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Experiment runner failed: {str(e)}")
