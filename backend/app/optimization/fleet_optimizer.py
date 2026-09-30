"""
Fleet Optimizer - Main orchestrator for all optimization algorithms.
"""
import time
import json
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Optional, Any
import numpy as np

from .qubo_formulator import QUBOFormulator, VehicleInfo, TripInfo, EMISSION_FACTORS, FUEL_PRICES
from .simulated_annealing import SimulatedAnnealing
from .baseline_solvers import GreedySolver, LinearAssignmentSolver


@dataclass
class AssignmentDetail:
    trip_id: int
    trip_code: str
    origin: str
    destination: str
    distance_km: float
    vehicle_id: int
    registration_number: str
    vehicle_type: str
    fuel_type: str
    predicted_fuel_liters: float
    fuel_cost_inr: float
    co2_emissions_kg: float


@dataclass
class OptimizationResult:
    algorithm: str
    run_name: str
    total_fuel_liters: float
    total_fuel_cost_inr: float
    total_emissions_kg: float
    objective_value: float
    computation_time_ms: float
    num_trips: int
    num_vehicles: int
    is_feasible: bool
    assignments: List[AssignmentDetail] = field(default_factory=list)
    constraint_violations: List[str] = field(default_factory=list)
    convergence_history: List[float] = field(default_factory=list)
    algorithm_stats: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self):
        d = asdict(self)
        return d


class FleetOptimizer:
    def __init__(self):
        self.formulator = QUBOFormulator()
        self.sa_solver = SimulatedAnnealing(
            initial_temp=150.0,
            cooling_rate=0.995,
            min_temp=0.01,
            max_iterations=12000,
            restarts=3,
        )
        self.greedy_solver = GreedySolver()
        self.la_solver = LinearAssignmentSolver()

    def _build_result(
        self,
        algorithm: str,
        run_name: str,
        assignment: Dict[int, int],
        vehicles: List[VehicleInfo],
        trips: List[TripInfo],
        cost_matrix: np.ndarray,
        emission_matrix: np.ndarray,
        computation_time_ms: float,
        convergence_history: List[float],
        algorithm_stats: dict,
    ) -> OptimizationResult:
        details = []
        total_fuel_cost = 0.0
        total_emissions = 0.0
        total_fuel_liters = 0.0

        for j, i in assignment.items():
            t = trips[j]
            v = vehicles[i]
            cost = float(cost_matrix[i, j])
            em = float(emission_matrix[i, j])
            price = FUEL_PRICES.get(v.fuel_type, 103.5)
            fuel_liters = cost / max(price, 1.0)

            total_fuel_cost += cost
            total_emissions += em
            total_fuel_liters += fuel_liters

            details.append(AssignmentDetail(
                trip_id=t.id,
                trip_code=t.trip_code,
                origin=t.origin,
                destination=t.destination,
                distance_km=t.distance_km,
                vehicle_id=v.id,
                registration_number=v.registration_number,
                vehicle_type=v.vehicle_type,
                fuel_type=v.fuel_type,
                predicted_fuel_liters=round(fuel_liters, 3),
                fuel_cost_inr=round(cost, 2),
                co2_emissions_kg=round(em, 3),
            ))

        constraint_check = self.formulator.check_constraints(assignment, vehicles, trips)

        return OptimizationResult(
            algorithm=algorithm,
            run_name=run_name,
            total_fuel_liters=round(total_fuel_liters, 3),
            total_fuel_cost_inr=round(total_fuel_cost, 2),
            total_emissions_kg=round(total_emissions, 3),
            objective_value=round(total_fuel_cost + total_emissions * 10, 2),
            computation_time_ms=round(computation_time_ms, 1),
            num_trips=len(trips),
            num_vehicles=len(vehicles),
            is_feasible=constraint_check["is_feasible"],
            assignments=details,
            constraint_violations=constraint_check["violations"],
            convergence_history=convergence_history,
            algorithm_stats=algorithm_stats,
        )

    def optimize(
        self,
        vehicles: List[VehicleInfo],
        trips: List[TripInfo],
        algorithm: str = "qubo_sa",
        run_name: str = "Optimization Run",
        objective_weights: Optional[Dict[str, float]] = None,
    ) -> OptimizationResult:
        if not vehicles or not trips:
            raise ValueError("Need at least one vehicle and one trip")

        # Build cost & emission matrices
        C = self.formulator.compute_cost_matrix(vehicles, trips)
        E = self.formulator.compute_emission_matrix(vehicles, trips, C)

        convergence = []
        stats = {}

        t0 = time.time()

        if algorithm == "greedy":
            assignment, _, stats = self.greedy_solver.solve(vehicles, trips, C)

        elif algorithm == "linear_assignment":
            assignment, _, stats = self.la_solver.solve(vehicles, trips, C)

        elif algorithm == "simulated_annealing":
            alpha = objective_weights.get("fuel_cost", 0.7) if objective_weights else 0.7
            assignment, _, convergence = self.sa_solver.solve_assignment(
                vehicles, trips, C, E, alpha=alpha
            )

        elif algorithm == "qubo_sa":
            Q, var_map, _, _ = self.formulator.build_qubo_matrix(
                vehicles, trips, objective_weights
            )
            binary_sol, energy, convergence = self.sa_solver.solve_qubo(Q, var_map)
            assignment = self.formulator.decode_solution(binary_sol, var_map, vehicles, trips)
            stats["qubo_energy"] = round(energy, 4)
            stats["qubo_size"] = Q.shape[0]

        else:
            raise ValueError(f"Unknown algorithm: {algorithm}")

        elapsed_ms = (time.time() - t0) * 1000

        return self._build_result(
            algorithm=algorithm,
            run_name=run_name,
            assignment=assignment,
            vehicles=vehicles,
            trips=trips,
            cost_matrix=C,
            emission_matrix=E,
            computation_time_ms=elapsed_ms,
            convergence_history=convergence,
            algorithm_stats=stats,
        )

    def compare_all(
        self,
        vehicles: List[VehicleInfo],
        trips: List[TripInfo],
        run_name: str = "Algorithm Comparison",
    ) -> List[OptimizationResult]:
        algorithms = ["greedy", "linear_assignment", "simulated_annealing", "qubo_sa"]
        results = []
        for alg in algorithms:
            try:
                r = self.optimize(vehicles, trips, algorithm=alg, run_name=f"{run_name} ({alg})")
                results.append(r)
            except Exception as e:
                print(f"Algorithm {alg} failed: {e}")
        return results


# Singleton
_optimizer = FleetOptimizer()


def get_optimizer() -> FleetOptimizer:
    return _optimizer
