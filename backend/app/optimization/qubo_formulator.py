"""
QUBO Formulation for Vehicle-to-Trip Assignment Problem.

Mathematical Formulation:
--------------------------
Decision variables:
  x_{i,j} ∈ {0,1}  →  1 if vehicle i is assigned to trip j

Objective (minimize):
  min  α·Σ_{i,j} c_{i,j}·x_{i,j}        [fuel cost term]
     + β·Σ_{i,j} e_{i,j}·x_{i,j}        [emission term]
     + λ₁·Σ_j (1 - Σ_i x_{i,j})²       [each trip gets exactly 1 vehicle]
     + λ₂·Σ_i (Σ_j x_{i,j} - 1)²·H(Σ_j x_{i,j}-1)  [each vehicle at most 1 trip]
     + λ₃·Σ_{i,j} (1-avail_i)·x_{i,j}  [unavailable vehicle penalty]

Where:
  c_{i,j} = estimated fuel cost (INR) if vehicle i does trip j
  e_{i,j} = estimated CO2 (kg) if vehicle i does trip j
  λ₁,λ₂,λ₃ = penalty strengths (must >> max objective cost)
"""
import numpy as np
from dataclasses import dataclass, field
from typing import List, Dict, Tuple, Optional


EMISSION_FACTORS = {"petrol": 2.31, "diesel": 2.68, "hybrid": 1.85, "electric": 0.0}
FUEL_PRICES = {"petrol": 103.5, "diesel": 90.25, "electric": 8.0, "hybrid": 103.5}


@dataclass
class VehicleInfo:
    id: int
    registration_number: str
    vehicle_type: str
    fuel_type: str
    weight_kg: float
    engine_cc: float
    baseline_mileage_kmpl: float
    is_available: bool
    vehicle_age: int = 0


@dataclass
class TripInfo:
    id: int
    trip_code: str
    origin: str
    destination: str
    distance_km: float
    payload_kg: float
    traffic_condition: str
    road_type: str


class QUBOFormulator:
    """Constructs QUBO matrix Q for fleet assignment."""

    def __init__(
        self,
        alpha: float = 0.6,   # fuel cost weight
        beta: float = 0.4,    # emission weight
        lambda1: float = 500.0,  # trip coverage penalty
        lambda2: float = 200.0,  # vehicle reuse penalty
        lambda3: float = 1000.0, # availability penalty
    ):
        self.alpha = alpha
        self.beta = beta
        self.lambda1 = lambda1
        self.lambda2 = lambda2
        self.lambda3 = lambda3

    def _estimate_fuel(self, vehicle: VehicleInfo, trip: TripInfo) -> float:
        """Estimate fuel consumption (liters) for vehicle i doing trip j."""
        traffic_factor = {"low": 0.90, "medium": 1.10, "high": 1.30}.get(trip.traffic_condition, 1.0)
        road_factor = {"highway": 0.88, "urban": 1.22, "mixed": 1.04}.get(trip.road_type, 1.0)
        payload_factor = 1.0 + trip.payload_kg * 0.00004
        age_factor = 1.0 + vehicle.vehicle_age * 0.007

        eff = vehicle.baseline_mileage_kmpl / (traffic_factor * road_factor * payload_factor * age_factor)
        return trip.distance_km / max(eff, 0.1)

    def compute_cost_matrix(
        self, vehicles: List[VehicleInfo], trips: List[TripInfo]
    ) -> np.ndarray:
        n_v, n_t = len(vehicles), len(trips)
        C = np.zeros((n_v, n_t))
        for i, v in enumerate(vehicles):
            for j, t in enumerate(trips):
                fuel = self._estimate_fuel(v, t)
                price = FUEL_PRICES.get(v.fuel_type, 103.5)
                C[i, j] = fuel * price
        return C

    def compute_emission_matrix(
        self, vehicles: List[VehicleInfo], trips: List[TripInfo], cost_matrix: np.ndarray
    ) -> np.ndarray:
        n_v, n_t = len(vehicles), len(trips)
        E = np.zeros((n_v, n_t))
        for i, v in enumerate(vehicles):
            ef = EMISSION_FACTORS.get(v.fuel_type, 2.31)
            price = FUEL_PRICES.get(v.fuel_type, 103.5)
            for j in range(n_t):
                fuel_liters = cost_matrix[i, j] / max(price, 1)
                E[i, j] = fuel_liters * ef
        return E

    def build_qubo_matrix(
        self,
        vehicles: List[VehicleInfo],
        trips: List[TripInfo],
        objective_weights: Optional[Dict[str, float]] = None,
    ) -> Tuple[np.ndarray, Dict[int, Tuple[int, int]], np.ndarray, np.ndarray]:
        """
        Returns (Q, variable_map, cost_matrix, emission_matrix)
        variable_map: flat_index → (vehicle_idx, trip_idx)
        """
        n_v, n_t = len(vehicles), len(trips)
        n_vars = n_v * n_t

        if objective_weights:
            alpha = objective_weights.get("fuel_cost", self.alpha)
            beta = objective_weights.get("emissions", self.beta)
        else:
            alpha, beta = self.alpha, self.beta

        C = self.compute_cost_matrix(vehicles, trips)
        E = self.compute_emission_matrix(vehicles, trips, C)

        # Normalize costs to [0,1] for numerical stability
        c_max = C.max() if C.max() > 0 else 1.0
        e_max = E.max() if E.max() > 0 else 1.0
        C_norm = C / c_max
        E_norm = E / e_max

        # Variable mapping: index k = i * n_t + j
        var_map = {i * n_t + j: (i, j) for i in range(n_v) for j in range(n_t)}

        Q = np.zeros((n_vars, n_vars))

        # 1. Linear terms: objective cost
        for k, (i, j) in var_map.items():
            Q[k, k] += alpha * C_norm[i, j] + beta * E_norm[i, j]

        # 2. Unavailable vehicle penalty
        for i, v in enumerate(vehicles):
            if not v.is_available:
                for j in range(n_t):
                    k = i * n_t + j
                    Q[k, k] += self.lambda3

        # 3. Trip coverage: each trip j must have exactly one vehicle
        # Penalty: λ₁ * (1 - Σ_i x_{i,j})²
        # Expand: λ₁ * (1 - 2·Σ x_{i,j} + (Σ x_{i,j})²)
        for j in range(n_t):
            for i in range(n_v):
                k = i * n_t + j
                Q[k, k] -= 2 * self.lambda1  # linear term
                for i2 in range(n_v):
                    k2 = i2 * n_t + j
                    Q[k, k2] += self.lambda1  # quadratic term

        # 4. Vehicle reuse: each vehicle at most one trip
        # Penalty: λ₂ * Σ_{j≠j'} x_{i,j} * x_{i,j'}
        for i in range(n_v):
            for j in range(n_t):
                for j2 in range(j + 1, n_t):
                    k1 = i * n_t + j
                    k2 = i * n_t + j2
                    Q[k1, k2] += 2 * self.lambda2

        # Make upper triangular (QUBO convention)
        Q = np.triu(Q + Q.T) - np.diag(np.diag(Q))

        return Q, var_map, C, E

    def decode_solution(
        self, binary_solution: np.ndarray, var_map: Dict, vehicles: List[VehicleInfo], trips: List[TripInfo]
    ) -> Dict[int, int]:
        """Returns {trip_idx: vehicle_idx} assignment."""
        n_t = len(trips)
        assignment = {}
        for k, val in enumerate(binary_solution):
            if val == 1:
                i, j = var_map[k]
                # keep first assignment per trip (lowest cost)
                if j not in assignment:
                    assignment[j] = i
        return assignment

    def evaluate_objective(self, binary_solution: np.ndarray, Q: np.ndarray) -> float:
        x = binary_solution.astype(float)
        return float(x @ Q @ x)

    def check_constraints(
        self, assignment: Dict[int, int], vehicles: List[VehicleInfo], trips: List[TripInfo]
    ) -> dict:
        violations = []
        # Check each trip has a vehicle
        for j in range(len(trips)):
            if j not in assignment:
                violations.append(f"Trip {trips[j].trip_code} has no assigned vehicle")
        # Check no vehicle used twice
        used_vehicles = list(assignment.values())
        if len(used_vehicles) != len(set(used_vehicles)):
            violations.append("One or more vehicles assigned to multiple trips")
        # Check availability
        for j, i in assignment.items():
            if not vehicles[i].is_available:
                violations.append(f"Vehicle {vehicles[i].registration_number} is not available")

        return {
            "violations": violations,
            "is_feasible": len(violations) == 0,
            "num_violations": len(violations),
        }
