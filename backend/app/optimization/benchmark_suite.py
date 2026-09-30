"""
Quantum-Inspired Benchmarking Lab Harness.
Compares:
1. Greedy Heuristic
2. Linear Assignment / Hungarian Algorithm (scipy.optimize.linear_sum_assignment)
3. Genetic Algorithm (Evolutionary selection, crossover, mutation)
4. Simulated Annealing (Metropolis-Hastings classical thermal annealing)
5. Transverse-Field Simulated Quantum Annealer (SQA with quantum tunneling schedule)

Includes multi-seed repetitions, statistical dispersion (mean, std, percentiles for box plots),
convergence history, and scientific rigor disclaimers.
"""
import time
import math
import random
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Tuple, Optional, Any
import numpy as np
from scipy.optimize import linear_sum_assignment

from .qubo_formulator import QUBOFormulator, VehicleInfo, TripInfo, EMISSION_FACTORS, FUEL_PRICES


@dataclass
class RunStatistics:
    mean: float
    std: float
    min: float
    max: float
    p25: float
    p75: float


@dataclass
class AlgorithmBenchmarkResult:
    algorithm_id: str
    algorithm_name: str
    category: str  # "Classical Heuristic", "Exact/Poly-time", "Metaheuristic", "Quantum-Inspired"
    seeds_evaluated: int
    execution_time_ms: RunStatistics
    objective_value: RunStatistics
    constraint_violations: RunStatistics
    best_objective: float
    worst_objective: float
    success_rate_pct: float
    convergence_curve: List[float]  # Sampled median iteration trajectory
    scientific_notes: str


@dataclass
class BenchmarkSuiteResult:
    problem_size: Dict[str, int]
    num_seeds: int
    algorithms: List[AlgorithmBenchmarkResult]
    summary_table: List[Dict[str, Any]]
    fastest_algorithm: str
    best_quality_algorithm: str
    disclaimer: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "problem_size": self.problem_size,
            "num_seeds": self.num_seeds,
            "algorithms": [asdict(a) for a in self.algorithms],
            "summary_table": self.summary_table,
            "fastest_algorithm": self.fastest_algorithm,
            "best_quality_algorithm": self.best_quality_algorithm,
            "disclaimer": self.disclaimer,
        }


def _calc_stats(values: List[float]) -> RunStatistics:
    arr = np.array(values, dtype=float)
    return RunStatistics(
        mean=round(float(np.mean(arr)), 3),
        std=round(float(np.std(arr)), 3),
        min=round(float(np.min(arr)), 3),
        max=round(float(np.max(arr)), 3),
        p25=round(float(np.percentile(arr, 25)), 3),
        p75=round(float(np.percentile(arr, 75)), 3),
    )


class BenchmarkSuite:
    """Rigorous evaluation suite for classical vs quantum-inspired fleet algorithms."""

    def __init__(self):
        self.formulator = QUBOFormulator()

    # --- 1. Greedy Solver ---
    def _solve_greedy(self, C: np.ndarray, seed: int) -> Tuple[Dict[int, int], float]:
        n_v, n_t = C.shape
        assignment = {}
        used = set()
        # Sort trips randomly based on seed to simulate variance across seeds
        rng = random.Random(seed)
        trip_order = list(range(n_t))
        rng.shuffle(trip_order)

        for j in trip_order:
            best_i = None
            best_cost = float('inf')
            for i in range(n_v):
                penalty = 1500.0 if i in used else 0.0
                cost = C[i, j] + penalty
                if cost < best_cost:
                    best_cost = cost
                    best_i = i
            assignment[j] = best_i
            used.add(best_i)

        total_cost = sum(C[assignment[j], j] for j in range(n_t))
        return assignment, total_cost

    # --- 2. Hungarian Algorithm ---
    def _solve_hungarian(self, C: np.ndarray, seed: int) -> Tuple[Dict[int, int], float]:
        # Linear sum assignment minimizes total cost
        row_ind, col_ind = linear_sum_assignment(C)
        assignment = {c: r for r, c in zip(row_ind, col_ind)}
        # Unassigned trips get closest vehicle
        for j in range(C.shape[1]):
            if j not in assignment:
                assignment[j] = int(np.argmin(C[:, j]))
        total_cost = sum(C[assignment[j], j] for j in range(C.shape[1]))
        return assignment, total_cost

    # --- 3. Genetic Algorithm ---
    def _solve_genetic(
        self, C: np.ndarray, seed: int, generations: int = 150, pop_size: int = 40
    ) -> Tuple[Dict[int, int], float, List[float]]:
        rng = random.Random(seed)
        n_v, n_t = C.shape

        def fitness(ind: List[int]) -> float:
            cost = sum(C[ind[j], j] for j in range(n_t))
            # penalty for duplicate vehicles if n_v >= n_t
            if n_v >= n_t:
                duplicates = len(ind) - len(set(ind))
                cost += duplicates * 200.0
            return cost

        # Initialize population
        pop = [[rng.randint(0, n_v - 1) for _ in range(n_t)] for _ in range(pop_size)]
        convergence = []

        best_ind = pop[0]
        best_cost = fitness(best_ind)

        for gen in range(generations):
            # Evaluate all
            scores = [fitness(ind) for ind in pop]
            min_score = min(scores)
            if min_score < best_cost:
                best_cost = min_score
                best_ind = pop[scores.index(min_score)]

            if gen % 10 == 0:
                convergence.append(round(best_cost, 2))

            # Selection (Tournament)
            selected = []
            for _ in range(pop_size):
                i1, i2 = rng.sample(range(pop_size), 2)
                selected.append(pop[i1] if scores[i1] < scores[i2] else pop[i2])

            # Crossover & Mutation
            next_pop = [best_ind]  # Elitism
            while len(next_pop) < pop_size:
                p1, p2 = rng.sample(selected, 2)
                # Two-point crossover
                cut1 = rng.randint(0, n_t - 1)
                cut2 = rng.randint(cut1, n_t)
                child = p1[:cut1] + p2[cut1:cut2] + p1[cut2:]
                # Mutation
                if rng.random() < 0.2:
                    m_idx = rng.randint(0, n_t - 1)
                    child[m_idx] = rng.randint(0, n_v - 1)
                next_pop.append(child)

            pop = next_pop

        assignment = {j: best_ind[j] for j in range(n_t)}
        return assignment, best_cost, convergence

    # --- 4. Classical Simulated Annealing ---
    def _solve_classical_sa(
        self, C: np.ndarray, seed: int, max_steps: int = 1500
    ) -> Tuple[Dict[int, int], float, List[float]]:
        rng = random.Random(seed)
        n_v, n_t = C.shape

        def cost_fn(state: List[int]) -> float:
            c = sum(C[state[j], j] for j in range(n_t))
            if n_v >= n_t:
                c += (len(state) - len(set(state))) * 250.0
            return c

        curr = [rng.randint(0, n_v - 1) for _ in range(n_t)]
        curr_cost = cost_fn(curr)
        best = list(curr)
        best_cost = curr_cost

        temp = 200.0
        cooling = 0.985
        convergence = []

        for step in range(max_steps):
            j = rng.randint(0, n_t - 1)
            old_v = curr[j]
            new_v = rng.randint(0, n_v - 1)
            curr[j] = new_v
            new_cost = cost_fn(curr)
            delta = new_cost - curr_cost

            if delta < 0 or rng.random() < math.exp(-delta / max(temp, 0.01)):
                curr_cost = new_cost
                if curr_cost < best_cost:
                    best_cost = curr_cost
                    best = list(curr)
            else:
                curr[j] = old_v

            temp *= cooling
            if step % 100 == 0:
                convergence.append(round(best_cost, 2))

        assignment = {j: best[j] for j in range(n_t)}
        return assignment, best_cost, convergence

    # --- 5. Transverse-Field Simulated Quantum Annealer (SQA) ---
    def _solve_sqa(
        self, C: np.ndarray, seed: int, max_steps: int = 1500
    ) -> Tuple[Dict[int, int], float, List[float]]:
        """
        Simulated Quantum Annealing: incorporates a time-decaying transverse magnetic field
        Gamma(t) that enables simulated quantum tunneling across tall, thin energy barriers.
        Effective tunneling probability P_tunnel ~ exp(-delta / (T + Gamma(t))).
        """
        rng = random.Random(seed)
        n_v, n_t = C.shape

        def cost_fn(state: List[int]) -> float:
            c = sum(C[state[j], j] for j in range(n_t))
            if n_v >= n_t:
                c += (len(state) - len(set(state))) * 250.0
            return c

        curr = [rng.randint(0, n_v - 1) for _ in range(n_t)]
        curr_cost = cost_fn(curr)
        best = list(curr)
        best_cost = curr_cost

        T_initial = 120.0
        gamma_0 = 80.0  # Initial transverse tunneling field
        convergence = []

        for step in range(max_steps):
            # Annealing schedules
            progress = step / max_steps
            T = T_initial * (1.0 - progress * 0.95)
            # Transverse field decays to zero
            gamma = gamma_0 * ((1.0 - progress) ** 1.8)

            # Propose spin flip / vehicle change
            j = rng.randint(0, n_t - 1)
            old_v = curr[j]
            new_v = rng.randint(0, n_v - 1)
            curr[j] = new_v
            new_cost = cost_fn(curr)
            delta = new_cost - curr_cost

            # Effective quantum-thermal tunneling probability
            effective_barrier = max(0.01, T + 0.65 * gamma)
            if delta < 0 or rng.random() < math.exp(-delta / effective_barrier):
                curr_cost = new_cost
                if curr_cost < best_cost:
                    best_cost = curr_cost
                    best = list(curr)
            else:
                curr[j] = old_v

            if step % 100 == 0:
                convergence.append(round(best_cost, 2))

        assignment = {j: best[j] for j in range(n_t)}
        return assignment, best_cost, convergence

    def run_benchmark(
        self,
        vehicles: List[VehicleInfo],
        trips: List[TripInfo],
        num_seeds: int = 5,
    ) -> BenchmarkSuiteResult:
        """Runs all 5 algorithms across multiple random seeds and aggregates statistics."""
        C = self.formulator.compute_cost_matrix(vehicles, trips)
        seeds = [42 + i * 17 for i in range(num_seeds)]

        alg_configs = [
            {
                "id": "greedy",
                "name": "Greedy Nearest-Fit",
                "category": "Classical Heuristic",
                "notes": "Fastest computation (O(N*M)); highly susceptible to local minima in tight capacity regimes.",
            },
            {
                "id": "hungarian",
                "name": "Hungarian Algorithm (LSAP)",
                "category": "Exact / Polynomial-Time",
                "notes": "Optimal O(N^3) matching for 1-to-1 unconstrained bipartite assignment; requires heuristics for complex multi-constraints.",
            },
            {
                "id": "genetic",
                "name": "Genetic Algorithm (GA)",
                "category": "Population Metaheuristic",
                "notes": "Evolutionary search with tournament selection and order crossover; steady global exploration.",
            },
            {
                "id": "simulated_annealing",
                "name": "Classical Simulated Annealing",
                "category": "Stochastic Metaheuristic",
                "notes": "Metropolis-Hastings thermal hopping; standard classical baseline for combinatorial optimization.",
            },
            {
                "id": "sqa_transverse",
                "name": "Transverse-Field SQA",
                "category": "Quantum-Inspired",
                "notes": "Simulated Quantum Annealing modeling transverse magnetic field tunneling to escape narrow energy barriers.",
            },
        ]

        results: List[AlgorithmBenchmarkResult] = []
        summary_rows: List[Dict[str, Any]] = []

        for cfg in alg_configs:
            alg_id = cfg["id"]
            times_ms: List[float] = []
            objectives: List[float] = []
            violations: List[float] = []
            sample_convergence: List[float] = []

            for seed in seeds:
                t0 = time.time()
                conv = []

                if alg_id == "greedy":
                    assign, cost = self._solve_greedy(C, seed)
                elif alg_id == "hungarian":
                    assign, cost = self._solve_hungarian(C, seed)
                elif alg_id == "genetic":
                    assign, cost, conv = self._solve_genetic(C, seed)
                elif alg_id == "simulated_annealing":
                    assign, cost, conv = self._solve_classical_sa(C, seed)
                elif alg_id == "sqa_transverse":
                    assign, cost, conv = self._solve_sqa(C, seed)
                else:
                    assign, cost = {}, 0.0

                elapsed = (time.time() - t0) * 1000
                times_ms.append(elapsed)
                objectives.append(cost)

                # Check constraint violations
                c_check = self.formulator.check_constraints(assign, vehicles, trips)
                violations.append(float(c_check["num_violations"]))

                if conv and not sample_convergence:
                    sample_convergence = conv

            if not sample_convergence:
                sample_convergence = [objectives[0]] * 15

            time_stats = _calc_stats(times_ms)
            obj_stats = _calc_stats(objectives)
            viol_stats = _calc_stats(violations)

            success_rate = round(float(np.mean([100.0 if v == 0 else 0.0 for v in violations])), 1)

            res = AlgorithmBenchmarkResult(
                algorithm_id=alg_id,
                algorithm_name=cfg["name"],
                category=cfg["category"],
                seeds_evaluated=num_seeds,
                execution_time_ms=time_stats,
                objective_value=obj_stats,
                constraint_violations=viol_stats,
                best_objective=obj_stats.min,
                worst_objective=obj_stats.max,
                success_rate_pct=success_rate,
                convergence_curve=sample_convergence,
                scientific_notes=cfg["notes"],
            )
            results.append(res)

            summary_rows.append({
                "algorithm": cfg["name"],
                "category": cfg["category"],
                "mean_time_ms": time_stats.mean,
                "mean_objective": obj_stats.mean,
                "std_objective": obj_stats.std,
                "best_objective": obj_stats.min,
                "feasibility_rate_pct": success_rate,
            })

        fastest = min(results, key=lambda r: r.execution_time_ms.mean).algorithm_name
        best_quality = min(results, key=lambda r: r.objective_value.mean).algorithm_name

        disclaimer = (
            "SCIENTIFIC NOTICE: Quantum-inspired algorithms in this lab (Transverse-Field SQA and QUBO SA) "
            "are mathematical simulations running on classical silicon CPUs. Comparisons demonstrate algorithmic "
            "search characteristics and convergence behaviors. No physical quantum hardware or quantum supremacy "
            "is asserted."
        )

        return BenchmarkSuiteResult(
            problem_size={"vehicles": len(vehicles), "trips": len(trips)},
            num_seeds=num_seeds,
            algorithms=results,
            summary_table=summary_rows,
            fastest_algorithm=fastest,
            best_quality_algorithm=best_quality,
            disclaimer=disclaimer,
        )


_benchmark_suite = BenchmarkSuite()

def get_benchmark_suite() -> BenchmarkSuite:
    return _benchmark_suite
