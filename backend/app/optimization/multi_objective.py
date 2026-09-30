"""
Multi-Objective Quantum-Inspired Fleet Optimization.
Supports:
1. 5 Conflicting Objectives:
   - Operating Cost (INR)
   - Carbon Emissions (kg CO2)
   - Fuel Consumption (Liters)
   - Total Travel Time (hours)
   - Fleet Utilization Balance (Standard deviation of workload across active vehicles)
2. Min-Max Normalized Composite Scalarization.
3. Pareto Frontier Generation via Systematic Weight-Space Sweeping & Non-Dominated Sorting.
4. Trade-off Analysis & Marginal Substitution Rates.
"""
import time
import math
import random
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Tuple, Optional, Any
import numpy as np

from .qubo_formulator import VehicleInfo, TripInfo, EMISSION_FACTORS, FUEL_PRICES


@dataclass
class ObjectiveVector:
    operating_cost_inr: float
    carbon_emissions_kg: float
    fuel_consumption_liters: float
    total_travel_time_hr: float
    utilization_imbalance_std: float

    def to_array(self) -> np.ndarray:
        return np.array([
            self.operating_cost_inr,
            self.carbon_emissions_kg,
            self.fuel_consumption_liters,
            self.total_travel_time_hr,
            self.utilization_imbalance_std,
        ])


@dataclass
class ParetoSolution:
    solution_id: str
    weights: Dict[str, float]
    objectives: ObjectiveVector
    normalized_composite_score: float
    assignments: Dict[int, int]  # trip_idx -> vehicle_idx
    is_pareto_optimal: bool = True
    rank: int = 1
    trade_off_note: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "solution_id": str(self.solution_id),
            "weights": {str(k): float(v) for k, v in self.weights.items()},
            "objectives": asdict(self.objectives),
            "normalized_composite_score": round(float(self.normalized_composite_score), 4),
            "assignments": {str(k): int(v) for k, v in self.assignments.items()},
            "is_pareto_optimal": bool(self.is_pareto_optimal),
            "rank": int(self.rank),
            "trade_off_note": str(self.trade_off_note),
        }


@dataclass
class ParetoFrontResult:
    frontier: List[ParetoSolution]
    all_evaluated: List[ParetoSolution]
    ideal_point: Dict[str, float]
    nadir_point: Dict[str, float]
    hypervolume_indicator: float
    trade_off_summary: List[str]
    computation_time_ms: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "frontier": [s.to_dict() for s in self.frontier],
            "all_evaluated": [s.to_dict() for s in self.all_evaluated],
            "ideal_point": self.ideal_point,
            "nadir_point": self.nadir_point,
            "hypervolume_indicator": round(self.hypervolume_indicator, 4),
            "trade_off_summary": self.trade_off_summary,
            "computation_time_ms": round(self.computation_time_ms, 2),
        }


class MultiObjectiveOptimizer:
    """Multi-Objective Fleet Assignment & Dispatch Optimizer."""

    def __init__(self):
        pass

    def _estimate_trip_metrics(
        self, vehicle: VehicleInfo, trip: TripInfo
    ) -> Tuple[float, float, float, float]:
        """
        Returns (cost_inr, co2_kg, fuel_liters, time_hr)
        """
        traffic_factor = {"low": 0.90, "medium": 1.10, "high": 1.30}.get(trip.traffic_condition, 1.0)
        road_factor = {"highway": 0.88, "urban": 1.22, "mixed": 1.04}.get(trip.road_type, 1.0)
        payload_factor = 1.0 + trip.payload_kg * 0.00004
        age_factor = 1.0 + vehicle.vehicle_age * 0.007

        eff = vehicle.baseline_mileage_kmpl / (traffic_factor * road_factor * payload_factor * age_factor)
        fuel_liters = trip.distance_km / max(eff, 0.1)

        price = FUEL_PRICES.get(vehicle.fuel_type, 103.5)
        ef = EMISSION_FACTORS.get(vehicle.fuel_type, 2.31)

        cost = fuel_liters * price
        emissions = fuel_liters * ef

        avg_speed = 40.0
        if vehicle.fuel_type == "electric":
            avg_speed = 36.0
        time_hr = trip.distance_km / avg_speed

        return cost, emissions, fuel_liters, time_hr

    def evaluate_solution(
        self,
        assignment: Dict[int, int],
        vehicles: List[VehicleInfo],
        trips: List[TripInfo],
    ) -> ObjectiveVector:
        tot_cost = 0.0
        tot_co2 = 0.0
        tot_fuel = 0.0
        tot_time = 0.0

        vehicle_workloads = {v.id: 0.0 for v in vehicles}

        for j, i in assignment.items():
            cost, co2, fuel, t_hr = self._estimate_trip_metrics(vehicles[i], trips[j])
            tot_cost += cost
            tot_co2 += co2
            tot_fuel += fuel
            tot_time += t_hr
            vehicle_workloads[vehicles[i].id] += trips[j].distance_km

        workload_vals = list(vehicle_workloads.values())
        workload_std = float(np.std(workload_vals)) if workload_vals else 0.0

        return ObjectiveVector(
            operating_cost_inr=round(tot_cost, 2),
            carbon_emissions_kg=round(tot_co2, 2),
            fuel_consumption_liters=round(tot_fuel, 2),
            total_travel_time_hr=round(tot_time, 2),
            utilization_imbalance_std=round(workload_std, 2),
        )

    def _solve_scalarized_assignment(
        self,
        vehicles: List[VehicleInfo],
        trips: List[TripInfo],
        weights: Dict[str, float],
        min_bounds: np.ndarray,
        max_bounds: np.ndarray,
    ) -> Dict[int, int]:
        """
        Solves greedy/hungarian heuristic for a specific objective weighting.
        """
        n_v, n_t = len(vehicles), len(trips)
        w_vec = np.array([
            weights.get("cost", 0.3),
            weights.get("emissions", 0.3),
            weights.get("fuel", 0.15),
            weights.get("time", 0.15),
            weights.get("balance", 0.1),
        ])
        w_vec = w_vec / max(np.sum(w_vec), 1e-6)

        # Precompute per vehicle-trip pair
        cost_matrix = np.zeros((n_v, n_t))
        span = np.maximum(max_bounds - min_bounds, 1e-4)

        for i in range(n_v):
            v = vehicles[i]
            for j in range(n_t):
                t = trips[j]
                c, co2, f, t_hr = self._estimate_trip_metrics(v, t)
                raw = np.array([c, co2, f, t_hr, 0.0])
                norm = (raw - min_bounds) / span
                cost_matrix[i, j] = np.dot(w_vec[:4], norm[:4])
                if not v.is_available:
                    cost_matrix[i, j] += 50.0

        # Hungarian assignment via scipy
        try:
            from scipy.optimize import linear_sum_assignment
            row_ind, col_ind = linear_sum_assignment(cost_matrix)
            # col_ind is trip, row_ind is vehicle
            # If n_v < n_t, some trips unassigned
            assignment = {}
            for r, c in zip(row_ind, col_ind):
                assignment[int(c)] = int(r)
            # If trips remaining, assign greedy best vehicle
            for j in range(n_t):
                if j not in assignment:
                    assignment[j] = int(np.argmin(cost_matrix[:, j]))
            return assignment
        except Exception:
            # Greedy fallback
            assignment = {}
            used_vehicles = set()
            for j in range(n_t):
                best_i = None
                best_c = float("inf")
                for i in range(n_v):
                    c = cost_matrix[i, j] + (10.0 if i in used_vehicles else 0.0)
                    if c < best_c:
                        best_c = c
                        best_i = i
                assignment[j] = int(best_i) if best_i is not None else 0
                used_vehicles.add(best_i)
            return assignment

    def compute_bounds(
        self, vehicles: List[VehicleInfo], trips: List[TripInfo]
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Compute empirical minimum and maximum bounds for the 5 objectives."""
        n_t = len(trips)
        # Best and worst case bounds
        costs, co2s, fuels, times = [], [], [], []
        for v in vehicles:
            for t in trips:
                c, em, f, th = self._estimate_trip_metrics(v, t)
                costs.append(c)
                co2s.append(em)
                fuels.append(f)
                times.append(th)

        min_cost = min(costs) * n_t * 0.85
        max_cost = max(costs) * n_t * 1.15

        min_co2 = min(co2s) * n_t * 0.85
        max_co2 = max(co2s) * n_t * 1.15

        min_fuel = min(fuels) * n_t * 0.85
        max_fuel = max(fuels) * n_t * 1.15

        min_time = min(times) * n_t * 0.85
        max_time = max(times) * n_t * 1.15

        min_bounds = np.array([min_cost, min_co2, min_fuel, min_time, 0.0])
        max_bounds = np.array([max_cost, max_co2, max_fuel, max_time, 200.0])
        return min_bounds, max_bounds

    def _is_dominated(self, obj_a: np.ndarray, obj_b: np.ndarray) -> bool:
        """Returns True if solution A dominates solution B (minimization)."""
        return bool(np.all(obj_a <= obj_b) and np.any(obj_a < obj_b))

    def generate_pareto_frontier(
        self,
        vehicles: List[VehicleInfo],
        trips: List[TripInfo],
        num_samples: int = 24,
    ) -> ParetoFrontResult:
        """
        Sweeps the 5-objective weight space to generate a Pareto front of non-dominated solutions.
        """
        t0 = time.time()
        min_bounds, max_bounds = self.compute_bounds(vehicles, trips)
        span = np.maximum(max_bounds - min_bounds, 1e-4)

        # Generate diverse weight combinations
        weight_sets = [
            # Extreme single-objective corners
            {"cost": 0.85, "emissions": 0.05, "fuel": 0.05, "time": 0.03, "balance": 0.02},
            {"cost": 0.05, "emissions": 0.85, "fuel": 0.05, "time": 0.03, "balance": 0.02},
            {"cost": 0.05, "emissions": 0.05, "fuel": 0.85, "time": 0.03, "balance": 0.02},
            {"cost": 0.05, "emissions": 0.05, "fuel": 0.05, "time": 0.80, "balance": 0.05},
            {"cost": 0.10, "emissions": 0.10, "fuel": 0.10, "time": 0.10, "balance": 0.60},
            # Balanced profiles
            {"cost": 0.35, "emissions": 0.35, "fuel": 0.10, "time": 0.10, "balance": 0.10},
            {"cost": 0.50, "emissions": 0.30, "fuel": 0.10, "time": 0.05, "balance": 0.05},
            {"cost": 0.30, "emissions": 0.50, "fuel": 0.10, "time": 0.05, "balance": 0.05},
            {"cost": 0.25, "emissions": 0.25, "fuel": 0.25, "time": 0.15, "balance": 0.10},
            {"cost": 0.40, "emissions": 0.10, "fuel": 0.30, "time": 0.10, "balance": 0.10},
            {"cost": 0.10, "emissions": 0.40, "fuel": 0.30, "time": 0.10, "balance": 0.10},
            {"cost": 0.20, "emissions": 0.20, "fuel": 0.10, "time": 0.40, "balance": 0.10},
        ]

        # Add random Dirichlet samples for simplex coverage
        rng = np.random.default_rng(42)
        while len(weight_sets) < num_samples:
            w = rng.dirichlet(np.ones(5))
            weight_sets.append({
                "cost": float(w[0]),
                "emissions": float(w[1]),
                "fuel": float(w[2]),
                "time": float(w[3]),
                "balance": float(w[4]),
            })

        all_solutions: List[ParetoSolution] = []

        for idx, w in enumerate(weight_sets):
            assign = self._solve_scalarized_assignment(vehicles, trips, w, min_bounds, max_bounds)
            obj = self.evaluate_solution(assign, vehicles, trips)
            obj_arr = obj.to_array()
            w_arr = np.array([w["cost"], w["emissions"], w["fuel"], w["time"], w["balance"]])
            w_arr = w_arr / max(np.sum(w_arr), 1e-6)

            norm_score = float(np.sum(w_arr * ((obj_arr - min_bounds) / span)))

            sol = ParetoSolution(
                solution_id=f"SOL-{idx+1:02d}",
                weights=w,
                objectives=obj,
                normalized_composite_score=norm_score,
                assignments=assign,
            )
            all_solutions.append(sol)

        # Non-dominated sorting
        frontier: List[ParetoSolution] = []
        for i, sol_a in enumerate(all_solutions):
            dominated = False
            a_arr = sol_a.objectives.to_array()
            for j, sol_b in enumerate(all_solutions):
                if i != j and self._is_dominated(sol_b.objectives.to_array(), a_arr):
                    dominated = True
                    break
            if not dominated:
                sol_a.is_pareto_optimal = True
                sol_a.rank = 1
                frontier.append(sol_a)
            else:
                sol_a.is_pareto_optimal = False
                sol_a.rank = 2

        # Sort frontier by operating cost
        frontier.sort(key=lambda s: s.objectives.operating_cost_inr)

        # Annotate trade-offs on frontier
        if len(frontier) >= 2:
            cheapest = frontier[0]
            cleanest = min(frontier, key=lambda s: s.objectives.carbon_emissions_kg)
            for s in frontier:
                co2_saved = cheapest.objectives.carbon_emissions_kg - s.objectives.carbon_emissions_kg
                cost_added = s.objectives.operating_cost_inr - cheapest.objectives.operating_cost_inr
                if co2_saved > 0.1:
                    rate = cost_added / co2_saved
                    s.trade_off_note = f"Saves {co2_saved:.1f} kg CO2 at ₹{rate:.2f} per kg CO2"
                elif s == cheapest:
                    s.trade_off_note = "Minimum Cost Baseline"
                elif s == cleanest:
                    s.trade_off_note = "Maximum Decarbonization Solution"
                else:
                    s.trade_off_note = "Balanced Trade-off"

        # Ideal and Nadir points
        ideal = {
            "operating_cost_inr": min(s.objectives.operating_cost_inr for s in all_solutions),
            "carbon_emissions_kg": min(s.objectives.carbon_emissions_kg for s in all_solutions),
            "fuel_consumption_liters": min(s.objectives.fuel_consumption_liters for s in all_solutions),
            "total_travel_time_hr": min(s.objectives.total_travel_time_hr for s in all_solutions),
            "utilization_imbalance_std": min(s.objectives.utilization_imbalance_std for s in all_solutions),
        }
        nadir = {
            "operating_cost_inr": max(s.objectives.operating_cost_inr for s in all_solutions),
            "carbon_emissions_kg": max(s.objectives.carbon_emissions_kg for s in all_solutions),
            "fuel_consumption_liters": max(s.objectives.fuel_consumption_liters for s in all_solutions),
            "total_travel_time_hr": max(s.objectives.total_travel_time_hr for s in all_solutions),
            "utilization_imbalance_std": max(s.objectives.utilization_imbalance_std for s in all_solutions),
        }

        # Approximate hypervolume
        hv = 0.0
        if len(frontier) >= 2:
            cost_span = max(nadir["operating_cost_inr"] - ideal["operating_cost_inr"], 1.0)
            emiss_span = max(nadir["carbon_emissions_kg"] - ideal["carbon_emissions_kg"], 1.0)
            norm_pts = [
                ((s.objectives.operating_cost_inr - ideal["operating_cost_inr"]) / cost_span,
                 (s.objectives.carbon_emissions_kg - ideal["carbon_emissions_kg"]) / emiss_span)
                for s in frontier
            ]
            norm_pts.sort(key=lambda p: p[0])
            for i in range(len(norm_pts) - 1):
                dx = norm_pts[i+1][0] - norm_pts[i][0]
                dy = 1.0 - norm_pts[i][1]
                hv += max(dx * dy, 0.0)

        # Summary bullets
        summaries = [
            f"Frontier contains {len(frontier)} non-dominated Pareto solutions out of {len(all_solutions)} evaluated configurations.",
            f"Cost span ranges from ₹{ideal['operating_cost_inr']:.2f} to ₹{nadir['operating_cost_inr']:.2f} across configurations.",
            f"Carbon abatement reaches up to {nadir['carbon_emissions_kg'] - ideal['carbon_emissions_kg']:.1f} kg CO2 with strategic vehicle matching.",
            "Scalarization employs Min-Max normalization to prevent differing unit magnitudes from skewing convergence.",
        ]

        elapsed_ms = (time.time() - t0) * 1000

        return ParetoFrontResult(
            frontier=frontier,
            all_evaluated=all_solutions,
            ideal_point=ideal,
            nadir_point=nadir,
            hypervolume_indicator=hv,
            trade_off_summary=summaries,
            computation_time_ms=elapsed_ms,
        )


_mo_optimizer = MultiObjectiveOptimizer()

def get_multi_objective_optimizer() -> MultiObjectiveOptimizer:
    return _mo_optimizer
