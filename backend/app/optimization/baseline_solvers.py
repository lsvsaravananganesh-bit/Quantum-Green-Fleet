"""Greedy and linear assignment baseline solvers."""
import numpy as np
from typing import Dict, Tuple, List, Optional
from scipy.optimize import linear_sum_assignment


class GreedySolver:
    """
    Greedy baseline: for each trip (sorted by distance descending),
    assign the cheapest available eligible vehicle.
    """

    def solve(
        self,
        vehicles: list,
        trips: list,
        cost_matrix: np.ndarray,
    ) -> Tuple[Dict[int, int], float, dict]:
        n_v, n_t = len(vehicles), len(trips)
        used_vehicles = set()
        assignment = {}

        # Sort trips by distance descending (prioritize long trips)
        trip_order = sorted(range(n_t), key=lambda j: trips[j].distance_km, reverse=True)

        for j in trip_order:
            best_i = None
            best_cost = np.inf
            for i in range(n_v):
                if i in used_vehicles:
                    continue
                if not vehicles[i].is_available:
                    continue
                if cost_matrix[i, j] < best_cost:
                    best_cost = cost_matrix[i, j]
                    best_i = i
            if best_i is not None:
                assignment[j] = best_i
                used_vehicles.add(best_i)

        total_cost = sum(cost_matrix[i, j] for j, i in assignment.items())
        stats = {
            "trips_assigned": len(assignment),
            "trips_unassigned": n_t - len(assignment),
        }
        return assignment, round(total_cost, 2), stats


class LinearAssignmentSolver:
    """
    Hungarian algorithm via scipy.optimize.linear_sum_assignment.
    Finds the globally optimal assignment for unconstrained problems.
    Only assigns available vehicles.
    """

    def solve(
        self,
        vehicles: list,
        trips: list,
        cost_matrix: np.ndarray,
    ) -> Tuple[Dict[int, int], float, dict]:
        n_v, n_t = len(vehicles), len(trips)

        # Build cost matrix with unavailable vehicles penalized
        C = cost_matrix.copy()
        BIG = 1e9
        for i, v in enumerate(vehicles):
            if not v.is_available:
                C[i, :] = BIG

        # scipy expects rows=workers, cols=jobs
        # If more vehicles than trips, pad cols; if more trips than vehicles, pad rows
        if n_v >= n_t:
            row_ind, col_ind = linear_sum_assignment(C)
        else:
            # More trips than vehicles - some trips unassigned
            C_padded = np.full((n_t, n_t), BIG)
            C_padded[:n_v, :] = C
            row_ind, col_ind = linear_sum_assignment(C_padded.T)
            # row_ind = trip indices, col_ind = vehicle indices
            assignment = {}
            total_cost = 0.0
            for trip_j, veh_i in zip(row_ind, col_ind):
                if veh_i < n_v and C[veh_i, trip_j] < BIG / 2:
                    assignment[trip_j] = veh_i
                    total_cost += cost_matrix[veh_i, trip_j]
            return assignment, round(total_cost, 2), {"method": "linear_sum_assignment_padded"}

        assignment = {}
        total_cost = 0.0
        for i, j in zip(row_ind, col_ind):
            if j < n_t and C[i, j] < BIG / 2:
                assignment[j] = i
                total_cost += cost_matrix[i, j]

        return assignment, round(total_cost, 2), {"method": "linear_sum_assignment"}
