"""
Simulated Annealing solver for QUBO and direct assignment problems.

The algorithm mimics the physical annealing process:
- Start with a random solution and high temperature T
- At each step: propose a small change (flip a bit)
- Accept if energy decreases, or with probability exp(-ΔE/T) if energy increases
- Gradually cool T until convergence

This is a quantum-inspired method because QUBO is the same formulation
used by D-Wave quantum annealers. Running SA on QUBO approximates
what a quantum annealer would do on real quantum hardware.
"""
import numpy as np
from typing import Tuple, List, Dict, Optional
import time


class SimulatedAnnealing:
    def __init__(
        self,
        initial_temp: float = 100.0,
        cooling_rate: float = 0.995,
        min_temp: float = 0.01,
        max_iterations: int = 10000,
        restarts: int = 3,
        seed: Optional[int] = 42,
    ):
        self.initial_temp = initial_temp
        self.cooling_rate = cooling_rate
        self.min_temp = min_temp
        self.max_iterations = max_iterations
        self.restarts = restarts
        self.rng = np.random.RandomState(seed)

    def solve_qubo(
        self, Q: np.ndarray, var_map: dict
    ) -> Tuple[np.ndarray, float, List[float]]:
        """
        Minimize x^T Q x where x ∈ {0,1}^n using simulated annealing.

        Returns: (best_solution, best_energy, convergence_history)
        """
        n = Q.shape[0]
        best_solution = None
        best_energy = np.inf
        convergence_history = []

        for restart in range(self.restarts):
            # Random initial solution
            x = self.rng.randint(0, 2, size=n).astype(float)
            energy = x @ Q @ x
            T = self.initial_temp

            local_best_x = x.copy()
            local_best_energy = energy

            iteration = 0
            while T > self.min_temp and iteration < self.max_iterations:
                # Flip a random bit
                idx = self.rng.randint(0, n)
                x_new = x.copy()
                x_new[idx] = 1 - x_new[idx]

                new_energy = x_new @ Q @ x_new
                delta = new_energy - energy

                # Accept with probability
                if delta < 0 or self.rng.random() < np.exp(-delta / T):
                    x = x_new
                    energy = new_energy

                if energy < local_best_energy:
                    local_best_x = x.copy()
                    local_best_energy = energy

                T *= self.cooling_rate
                iteration += 1

                if iteration % 500 == 0:
                    convergence_history.append(round(local_best_energy, 4))

            if local_best_energy < best_energy:
                best_energy = local_best_energy
                best_solution = local_best_x.copy()

        return best_solution.astype(int), best_energy, convergence_history

    def solve_assignment(
        self,
        vehicles: list,
        trips: list,
        cost_matrix: np.ndarray,
        emission_matrix: Optional[np.ndarray] = None,
        alpha: float = 0.7,
    ) -> Tuple[Dict[int, int], float, List[float]]:
        """
        Direct SA on the assignment problem.
        State: assignment = [vehicle_idx for each trip], -1 = unassigned
        Neighbor: swap vehicle for one random trip
        Energy: total weighted cost
        """
        n_v, n_t = len(vehicles), len(trips)
        available = [i for i, v in enumerate(vehicles) if v.is_available]
        if not available:
            return {}, 0.0, []

        E = emission_matrix if emission_matrix is not None else np.zeros_like(cost_matrix)
        e_max = E.max() if E.max() > 0 else 1.0
        c_max = cost_matrix.max() if cost_matrix.max() > 0 else 1.0

        def compute_energy(asgn):
            total = 0.0
            for j, i in enumerate(asgn):
                if i >= 0:
                    total += alpha * cost_matrix[i, j] / c_max + (1 - alpha) * E[i, j] / e_max
            return total

        def random_init():
            asgn = [-1] * n_t
            avail_copy = available.copy()
            self.rng.shuffle(avail_copy)
            for j in range(min(n_t, len(avail_copy))):
                asgn[j] = avail_copy[j]
            return asgn

        best_asgn = None
        best_energy = np.inf
        convergence_history = []

        for restart in range(self.restarts):
            asgn = random_init()
            energy = compute_energy(asgn)
            T = self.initial_temp

            local_best = asgn.copy()
            local_best_e = energy

            iteration = 0
            while T > self.min_temp and iteration < self.max_iterations:
                # Choose random trip and swap its vehicle
                j = self.rng.randint(0, n_t)
                new_v = self.rng.choice(available)
                new_asgn = asgn.copy()
                new_asgn[j] = new_v
                new_energy = compute_energy(new_asgn)
                delta = new_energy - energy

                if delta < 0 or self.rng.random() < np.exp(-delta / max(T, 1e-10)):
                    asgn = new_asgn
                    energy = new_energy

                if energy < local_best_e:
                    local_best = asgn.copy()
                    local_best_e = energy

                T *= self.cooling_rate
                iteration += 1
                if iteration % 500 == 0:
                    convergence_history.append(round(local_best_e * c_max, 2))

            if local_best_e < best_energy:
                best_energy = local_best_e
                best_asgn = local_best.copy()

        result = {j: i for j, i in enumerate(best_asgn) if i >= 0}
        actual_cost = sum(cost_matrix[i, j] for j, i in result.items())
        return result, round(actual_cost, 2), convergence_history
