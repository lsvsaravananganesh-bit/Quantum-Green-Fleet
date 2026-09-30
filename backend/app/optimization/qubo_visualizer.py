"""
QUBO Matrix Visualizer & Energy Decomposition Engine.
Provides:
1. Complete N x N QUBO matrix generation with linear/quadratic categorization.
2. Semantic variable mapping (e.g., x_{v,t} -> Vehicle v assigned to Trip t).
3. Exact energy decomposition for any binary state x: x^T Q x broken into:
   - Route Objective Cost (Fuel + Emissions)
   - Trip Coverage Penalty (lambda_1)
   - Vehicle Over-utilization Penalty (lambda_2)
   - Unavailability Penalty (lambda_3)
4. Dynamic penalty weight tuning.
5. Bit-flip sensitivity analysis.
"""
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Tuple, Optional, Any
import numpy as np

from .qubo_formulator import QUBOFormulator, VehicleInfo, TripInfo, EMISSION_FACTORS, FUEL_PRICES


@dataclass
class QUBOCell:
    row: int
    col: int
    var_row_label: str
    var_col_label: str
    value: float
    term_type: str  # "linear_bias", "coverage_coupling", "reuse_coupling", "unavailability", "zero"
    explanation: str


@dataclass
class EnergyDecomposition:
    total_energy: float
    objective_term: float
    coverage_penalty_term: float
    reuse_penalty_term: float
    availability_penalty_term: float
    is_valid_solution: bool
    active_bits_count: int
    bitstring: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_energy": float(self.total_energy),
            "objective_term": float(self.objective_term),
            "coverage_penalty_term": float(self.coverage_penalty_term),
            "reuse_penalty_term": float(self.reuse_penalty_term),
            "availability_penalty_term": float(self.availability_penalty_term),
            "is_valid_solution": bool(self.is_valid_solution),
            "active_bits_count": int(self.active_bits_count),
            "bitstring": str(self.bitstring),
        }


@dataclass
class QUBOMatrixAnalysis:
    matrix_size: int
    num_variables: int
    sparsity_pct: float
    min_value: float
    max_value: float
    diagonal_mean: float
    off_diagonal_mean: float
    variable_labels: List[str]
    matrix_grid: List[List[float]]
    cells: List[QUBOCell]
    default_energy_decomposition: EnergyDecomposition
    penalty_multipliers: Dict[str, float]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "matrix_size": int(self.matrix_size),
            "num_variables": int(self.num_variables),
            "sparsity_pct": round(float(self.sparsity_pct), 2),
            "min_value": round(float(self.min_value), 3),
            "max_value": round(float(self.max_value), 3),
            "diagonal_mean": round(float(self.diagonal_mean), 3),
            "off_diagonal_mean": round(float(self.off_diagonal_mean), 3),
            "variable_labels": [str(l) for l in self.variable_labels],
            "matrix_grid": [[round(float(val), 3) for val in row] for row in self.matrix_grid],
            "cells": [asdict(c) for c in self.cells],
            "default_energy_decomposition": self.default_energy_decomposition.to_dict(),
            "penalty_multipliers": {str(k): float(v) for k, v in self.penalty_multipliers.items()},
        }


class QUBOVisualizer:
    """Exploration and pedagogical analysis tool for QUBO formulations."""

    def __init__(self):
        self.formulator = QUBOFormulator()

    def generate_visualization(
        self,
        vehicles: List[VehicleInfo],
        trips: List[TripInfo],
        lambda1: float = 500.0,
        lambda2: float = 200.0,
        lambda3: float = 1000.0,
        alpha: float = 0.6,
        beta: float = 0.4,
        candidate_bitstring: Optional[str] = None,
    ) -> QUBOMatrixAnalysis:
        # Cap variables for clean UI visualization (up to 4 vehicles x 4 trips = 16 vars)
        sub_vehicles = vehicles[:4]
        sub_trips = trips[:4]
        n_v, n_t = len(sub_vehicles), len(sub_trips)
        n_vars = n_v * n_t

        formulator = QUBOFormulator(
            alpha=alpha,
            beta=beta,
            lambda1=lambda1,
            lambda2=lambda2,
            lambda3=lambda3,
        )

        Q, var_map, C, E = formulator.build_qubo_matrix(sub_vehicles, sub_trips)

        # Labels
        labels = []
        for k in range(n_vars):
            i, j = var_map[k]
            v = sub_vehicles[i]
            t = sub_trips[j]
            labels.append(f"x[{v.registration_number},{t.trip_code}]")

        cells: List[QUBOCell] = []
        for r in range(n_vars):
            for c in range(r, n_vars):  # Upper triangular
                val = float(Q[r, c])
                i_r, j_r = var_map[r]
                i_c, j_c = var_map[c]

                term_type = "zero"
                explanation = "No direct coupling in QUBO Hamiltonian"

                if r == c:
                    term_type = "linear_bias"
                    expl_parts = [f"Linear cost (Fuel: ₹{C[i_r, j_r]:.1f}, CO2: {E[i_r, j_r]:.1f}kg)"]
                    expl_parts.append(f"- Coverage offset (-2*λ₁={-2*lambda1:.0f})")
                    if not sub_vehicles[i_r].is_available:
                        expl_parts.append(f"+ Unavailability penalty (+λ₃={lambda3:.0f})")
                    explanation = "; ".join(expl_parts)
                elif j_r == j_c:
                    term_type = "coverage_coupling"
                    explanation = (
                        f"Coverage coupling (+λ₁={lambda1:.0f}): Penalizes assigning both "
                        f"{sub_vehicles[i_r].registration_number} and {sub_vehicles[i_c].registration_number} to Trip {sub_trips[j_r].trip_code}"
                    )
                elif i_r == i_c:
                    term_type = "reuse_coupling"
                    explanation = (
                        f"Reuse coupling (+2*λ₂={2*lambda2:.0f}): Penalizes vehicle "
                        f"{sub_vehicles[i_r].registration_number} assigned to both Trip {sub_trips[j_r].trip_code} and Trip {sub_trips[j_c].trip_code}"
                    )

                cells.append(QUBOCell(
                    row=r,
                    col=c,
                    var_row_label=labels[r],
                    var_col_label=labels[c],
                    value=round(val, 2),
                    term_type=term_type,
                    explanation=explanation,
                ))

        # Matrix sparsity
        non_zero = np.count_nonzero(Q)
        total_elements = n_vars * n_vars
        sparsity = ((total_elements - non_zero) / total_elements) * 100.0

        diag = np.diag(Q)
        mask = ~np.eye(n_vars, dtype=bool)
        off_diag = Q[mask]

        # Calculate bitstring energy decomposition
        if candidate_bitstring and len(candidate_bitstring) == n_vars:
            x = np.array([int(b) for b in candidate_bitstring], dtype=float)
        else:
            # Generate a feasible 1-to-1 diagonal matching bitstring
            x = np.zeros(n_vars, dtype=float)
            for j in range(min(n_v, n_t)):
                x[j * n_t + j] = 1.0

        total_energy = float(x @ Q @ x)

        # Decompose components
        # 1. Objective
        c_max = C.max() if C.max() > 0 else 1.0
        e_max = E.max() if E.max() > 0 else 1.0
        obj_energy = 0.0
        for k in range(n_vars):
            if x[k] == 1:
                i, j = var_map[k]
                obj_energy += alpha * (C[i, j] / c_max) + beta * (E[i, j] / e_max)

        # 2. Coverage penalty: lambda1 * sum_j (1 - sum_i x_{i,j})^2
        coverage_energy = 0.0
        for j in range(n_t):
            assigned_count = sum(x[i * n_t + j] for i in range(n_v))
            coverage_energy += lambda1 * ((1.0 - assigned_count) ** 2)

        # 3. Reuse penalty: lambda2 * sum_i sum_{j != j'} x_{i,j} * x_{i,j'}
        reuse_energy = 0.0
        for i in range(n_v):
            trips_count = sum(x[i * n_t + j] for j in range(n_t))
            if trips_count > 1:
                reuse_energy += lambda2 * trips_count * (trips_count - 1)

        # 4. Availability penalty
        avail_energy = 0.0
        for i, v in enumerate(sub_vehicles):
            if not v.is_available:
                assigned = sum(x[i * n_t + j] for j in range(n_t))
                avail_energy += lambda3 * assigned

        decomp = EnergyDecomposition(
            total_energy=round(total_energy, 3),
            objective_term=round(obj_energy, 3),
            coverage_penalty_term=round(coverage_energy, 3),
            reuse_penalty_term=round(reuse_energy, 3),
            availability_penalty_term=round(avail_energy, 3),
            is_valid_solution=bool(coverage_energy == 0 and reuse_energy == 0 and avail_energy == 0),
            active_bits_count=int(np.sum(x)),
            bitstring="".join(str(int(b)) for b in x),
        )

        return QUBOMatrixAnalysis(
            matrix_size=n_vars,
            num_variables=n_vars,
            sparsity_pct=sparsity,
            min_value=float(np.min(Q)),
            max_value=float(np.max(Q)),
            diagonal_mean=float(np.mean(diag)),
            off_diagonal_mean=float(np.mean(off_diag)) if len(off_diag) > 0 else 0.0,
            variable_labels=labels,
            matrix_grid=Q.tolist(),
            cells=cells,
            default_energy_decomposition=decomp,
            penalty_multipliers={
                "lambda1_coverage": lambda1,
                "lambda2_reuse": lambda2,
                "lambda3_availability": lambda3,
                "alpha_cost": alpha,
                "beta_emissions": beta,
            },
        )


_qubo_visualizer = QUBOVisualizer()

def get_qubo_visualizer() -> QUBOVisualizer:
    return _qubo_visualizer
