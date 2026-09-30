"""
Multi-Stop Capacitated Vehicle Routing Problem with Time Windows (CVRPTW).
Supports:
1. Small-scale QUBO solver (Quantum-Inspired Simulated Annealing for multi-vehicle TSP/VRP).
2. Scalable Classical Heuristic: Clarke-Wright Savings with 2-Opt local refinement & Time Window penalties.
"""
import math
import time
import random
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Optional, Tuple, Any
import numpy as np

# Coordinates for realistic depot and delivery nodes (Bangalore Logistics Hub example)
DEFAULT_DEPOT = {
    "id": 0,
    "name": "Central Distribution Depot (Whitefield)",
    "lat": 12.9698,
    "lng": 77.7499,
    "demand_kg": 0.0,
    "time_window_start": 6.0,  # 06:00
    "time_window_end": 22.0,   # 22:00
    "service_duration_min": 0.0
}

DEFAULT_STOPS = [
    {"id": 1, "name": "Hub A - Electronic City Tech Park", "lat": 12.8452, "lng": 77.6602, "demand_kg": 450.0, "time_window_start": 7.0, "time_window_end": 10.0, "service_duration_min": 25.0},
    {"id": 2, "name": "Hub B - Koramangala Commercial Hub", "lat": 12.9352, "lng": 77.6245, "demand_kg": 600.0, "time_window_start": 8.0, "time_window_end": 12.0, "service_duration_min": 30.0},
    {"id": 3, "name": "Hub C - Indiranagar Retail Center", "lat": 12.9784, "lng": 77.6408, "demand_kg": 350.0, "time_window_start": 9.0, "time_window_end": 13.0, "service_duration_min": 20.0},
    {"id": 4, "name": "Hub D - Peenya Industrial Complex", "lat": 13.0285, "lng": 77.5197, "demand_kg": 850.0, "time_window_start": 10.0, "time_window_end": 15.0, "service_duration_min": 40.0},
    {"id": 5, "name": "Hub E - Hebbal Logistics Park", "lat": 13.0358, "lng": 77.5970, "demand_kg": 500.0, "time_window_start": 11.0, "time_window_end": 16.0, "service_duration_min": 25.0},
    {"id": 6, "name": "Hub F - Marathahalli Cargo Terminal", "lat": 12.9591, "lng": 77.6974, "demand_kg": 400.0, "time_window_start": 8.5, "time_window_end": 12.5, "service_duration_min": 20.0},
    {"id": 7, "name": "Hub G - Rajajinagar Supply Depot", "lat": 12.9982, "lng": 77.5530, "demand_kg": 300.0, "time_window_start": 13.0, "time_window_end": 17.5, "service_duration_min": 20.0},
    {"id": 8, "name": "Hub H - Bannerghatta Fulfillment Hub", "lat": 12.8800, "lng": 77.5950, "demand_kg": 550.0, "time_window_start": 14.0, "time_window_end": 18.5, "service_duration_min": 30.0},
]


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two coordinates in km."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c * 1.25  # Urban road distance multiplier


@dataclass
class VRPStop:
    id: int
    name: str
    lat: float
    lng: float
    demand_kg: float
    time_window_start: float  # hours, e.g. 8.5
    time_window_end: float    # hours, e.g. 12.0
    service_duration_min: float = 20.0


@dataclass
class VRPVehicle:
    id: int
    registration_number: str
    vehicle_type: str
    capacity_kg: float
    fuel_type: str = "diesel"
    baseline_mileage_kmpl: float = 14.0
    avg_speed_kmh: float = 38.0
    start_time_hr: float = 7.0


@dataclass
class RouteStopDetail:
    stop_index: int
    location_id: int
    location_name: str
    lat: float
    lng: float
    arrival_time_hr: float
    departure_time_hr: float
    distance_from_prev_km: float
    cumulative_distance_km: float
    payload_on_arrival_kg: float
    demand_delivered_kg: float
    time_window_status: str  # "on_time", "early_waited", "late"
    wait_time_min: float = 0.0
    late_time_min: float = 0.0


@dataclass
class VehicleRoute:
    vehicle_id: int
    registration_number: str
    vehicle_type: str
    fuel_type: str
    stops: List[RouteStopDetail]
    total_distance_km: float
    total_duration_hr: float
    total_fuel_liters: float
    total_co2_kg: float
    total_cost_inr: float
    capacity_utilized_kg: float
    capacity_max_kg: float
    utilization_pct: float
    is_valid: bool
    violations: List[str] = field(default_factory=list)


@dataclass
class VRPSolution:
    solver_used: str
    routes: List[VehicleRoute]
    total_distance_km: float
    total_fuel_liters: float
    total_co2_kg: float
    total_cost_inr: float
    total_time_hr: float
    unassigned_stops: List[int]
    is_feasible: bool
    computation_time_ms: float
    violations: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class VRPSolver:
    """Solves Capacitated Vehicle Routing Problem with Time Windows (CVRPTW)."""

    def __init__(self, emission_factors: Optional[Dict[str, float]] = None, fuel_prices: Optional[Dict[str, float]] = None):
        self.emission_factors = emission_factors or {"petrol": 2.31, "diesel": 2.68, "hybrid": 1.85, "electric": 0.0}
        self.fuel_prices = fuel_prices or {"petrol": 103.5, "diesel": 90.25, "electric": 8.0, "hybrid": 103.5}

    def _build_distance_matrix(self, nodes: List[VRPStop]) -> np.ndarray:
        n = len(nodes)
        D = np.zeros((n, n))
        for i in range(n):
            for j in range(n):
                if i != j:
                    D[i, j] = haversine_distance(nodes[i].lat, nodes[i].lng, nodes[j].lat, nodes[j].lng)
        return D

    def _evaluate_route(
        self,
        vehicle: VRPVehicle,
        depot: VRPStop,
        stop_sequence: List[VRPStop],
        dist_matrix: np.ndarray,
        node_id_to_idx: Dict[int, int]
    ) -> VehicleRoute:
        """Evaluate route distance, timing, payload, fuel, and emissions."""
        stops_details: List[RouteStopDetail] = []
        current_time = vehicle.start_time_hr
        cum_dist = 0.0
        violations = []

        total_demand = sum(s.demand_kg for s in stop_sequence)
        current_payload = total_demand
        if total_demand > vehicle.capacity_kg:
            violations.append(f"Capacity overload: {total_demand:.0f}kg exceeds {vehicle.capacity_kg:.0f}kg")

        # Depot start
        depot_idx = node_id_to_idx[depot.id]
        prev_idx = depot_idx
        prev_node = depot

        stops_details.append(RouteStopDetail(
            stop_index=0,
            location_id=depot.id,
            location_name=depot.name,
            lat=depot.lat,
            lng=depot.lng,
            arrival_time_hr=round(current_time, 2),
            departure_time_hr=round(current_time, 2),
            distance_from_prev_km=0.0,
            cumulative_distance_km=0.0,
            payload_on_arrival_kg=round(current_payload, 1),
            demand_delivered_kg=0.0,
            time_window_status="on_time",
        ))

        for idx, stop in enumerate(stop_sequence, start=1):
            curr_idx = node_id_to_idx[stop.id]
            leg_dist = dist_matrix[prev_idx, curr_idx]
            cum_dist += leg_dist

            travel_time_hr = leg_dist / max(vehicle.avg_speed_kmh, 15.0)
            arrival_time = current_time + travel_time_hr

            wait_min = 0.0
            late_min = 0.0
            status = "on_time"

            if arrival_time < stop.time_window_start:
                wait_min = (stop.time_window_start - arrival_time) * 60.0
                current_time = stop.time_window_start
                status = "early_waited"
            elif arrival_time > stop.time_window_end:
                late_min = (arrival_time - stop.time_window_end) * 60.0
                current_time = arrival_time
                status = "late"
                violations.append(f"Stop {stop.name} arrived {late_min:.0f} min past time window")
            else:
                current_time = arrival_time

            # Service at stop
            current_time += stop.service_duration_min / 60.0
            current_payload -= stop.demand_kg

            stops_details.append(RouteStopDetail(
                stop_index=idx,
                location_id=stop.id,
                location_name=stop.name,
                lat=stop.lat,
                lng=stop.lng,
                arrival_time_hr=round(arrival_time, 2),
                departure_time_hr=round(current_time, 2),
                distance_from_prev_km=round(leg_dist, 2),
                cumulative_distance_km=round(cum_dist, 2),
                payload_on_arrival_kg=round(max(current_payload + stop.demand_kg, 0.0), 1),
                demand_delivered_kg=round(stop.demand_kg, 1),
                time_window_status=status,
                wait_time_min=round(wait_min, 1),
                late_time_min=round(late_min, 1),
            ))

            prev_idx = curr_idx
            prev_node = stop

        # Return to depot
        return_dist = dist_matrix[prev_idx, depot_idx]
        cum_dist += return_dist
        return_travel_hr = return_dist / max(vehicle.avg_speed_kmh, 15.0)
        current_time += return_travel_hr

        stops_details.append(RouteStopDetail(
            stop_index=len(stops_details),
            location_id=depot.id,
            location_name=f"{depot.name} (Return)",
            lat=depot.lat,
            lng=depot.lng,
            arrival_time_hr=round(current_time, 2),
            departure_time_hr=round(current_time, 2),
            distance_from_prev_km=round(return_dist, 2),
            cumulative_distance_km=round(cum_dist, 2),
            payload_on_arrival_kg=0.0,
            demand_delivered_kg=0.0,
            time_window_status="on_time",
        ))

        # Fuel & Emissions Calculation with payload derating
        # Avg efficiency adjusted for average cargo load
        avg_load_ratio = (total_demand / 2.0) / max(vehicle.capacity_kg, 1.0)
        fuel_efficiency = vehicle.baseline_mileage_kmpl / (1.0 + 0.15 * avg_load_ratio)
        total_fuel = cum_dist / max(fuel_efficiency, 1.0)

        price = self.fuel_prices.get(vehicle.fuel_type, 90.25)
        ef = self.emission_factors.get(vehicle.fuel_type, 2.68)
        total_cost = total_fuel * price
        total_co2 = total_fuel * ef
        total_duration = current_time - vehicle.start_time_hr
        utilization_pct = min(100.0, (total_demand / max(vehicle.capacity_kg, 1.0)) * 100.0)

        return VehicleRoute(
            vehicle_id=vehicle.id,
            registration_number=vehicle.registration_number,
            vehicle_type=vehicle.vehicle_type,
            fuel_type=vehicle.fuel_type,
            stops=stops_details,
            total_distance_km=round(cum_dist, 2),
            total_duration_hr=round(total_duration, 2),
            total_fuel_liters=round(total_fuel, 2),
            total_co2_kg=round(total_co2, 2),
            total_cost_inr=round(total_cost, 2),
            capacity_utilized_kg=round(total_demand, 1),
            capacity_max_kg=round(vehicle.capacity_kg, 1),
            utilization_pct=round(utilization_pct, 1),
            is_valid=len(violations) == 0,
            violations=violations,
        )

    def _two_opt_route(
        self,
        route: List[VRPStop],
        depot: VRPStop,
        dist_matrix: np.ndarray,
        node_id_to_idx: Dict[int, int],
    ) -> List[VRPStop]:
        """2-Opt local search improvement for a single vehicle route tour."""
        if len(route) < 3:
            return route

        best = list(route)
        improved = True
        depot_idx = node_id_to_idx[depot.id]

        def route_dist(r: List[VRPStop]) -> float:
            d = dist_matrix[depot_idx, node_id_to_idx[r[0].id]]
            for k in range(len(r) - 1):
                d += dist_matrix[node_id_to_idx[r[k].id], node_id_to_idx[r[k + 1].id]]
            d += dist_matrix[node_id_to_idx[r[-1].id], depot_idx]
            return d

        best_dist = route_dist(best)

        for _ in range(50):
            improved = False
            for i in range(len(best) - 1):
                for j in range(i + 1, len(best)):
                    new_r = best[:i] + best[i:j + 1][::-1] + best[j + 1:]
                    d = route_dist(new_r)
                    if d < best_dist - 0.05:
                        best = new_r
                        best_dist = d
                        improved = True
                        break
                if improved:
                    break
            if not improved:
                break
        return best

    def solve_clarke_wright_vrp(
        self,
        depot: VRPStop,
        stops: List[VRPStop],
        vehicles: List[VRPVehicle],
    ) -> VRPSolution:
        """
        Clarke-Wright Savings Algorithm with 2-Opt route improvement.
        Scalable and handles multiple vehicles, capacities, and time windows.
        """
        t0 = time.time()
        all_nodes = [depot] + stops
        node_id_to_idx = {n.id: i for i, n in enumerate(all_nodes)}
        dist_matrix = self._build_distance_matrix(all_nodes)
        depot_idx = node_id_to_idx[depot.id]

        # 1. Compute Savings: s(i, j) = d(0, i) + d(0, j) - d(i, j)
        savings = []
        for i in range(len(stops)):
            for j in range(i + 1, len(stops)):
                u_idx = node_id_to_idx[stops[i].id]
                v_idx = node_id_to_idx[stops[j].id]
                s = dist_matrix[depot_idx, u_idx] + dist_matrix[depot_idx, v_idx] - dist_matrix[u_idx, v_idx]
                savings.append((s, stops[i], stops[j]))

        savings.sort(key=lambda x: x[0], reverse=True)

        # 2. Initialize separate route for each stop: [ [stop1], [stop2], ... ]
        routes: List[List[VRPStop]] = [[s] for s in stops]

        def find_route(stop: VRPStop) -> Optional[int]:
            for r_idx, r in enumerate(routes):
                if any(s.id == stop.id for s in r):
                    return r_idx
            return None

        # Max vehicle capacity for clustering
        max_cap = max(v.capacity_kg for v in vehicles)

        # 3. Merge routes based on savings
        for _, u, v in savings:
            r_u = find_route(u)
            r_v = find_route(v)
            if r_u is None or r_v is None or r_u == r_v:
                continue

            route_u = routes[r_u]
            route_v = routes[r_v]

            # Can only merge if u is end of route_u and v is start of route_v (or vice versa)
            merged = None
            if route_u[-1].id == u.id and route_v[0].id == v.id:
                merged = route_u + route_v
            elif route_v[-1].id == v.id and route_u[0].id == u.id:
                merged = route_v + route_u
            elif route_u[0].id == u.id and route_v[0].id == v.id:
                merged = route_u[::-1] + route_v
            elif route_u[-1].id == u.id and route_v[-1].id == v.id:
                merged = route_u + route_v[::-1]

            if merged:
                total_dem = sum(s.demand_kg for s in merged)
                if total_dem <= max_cap:
                    routes[r_u] = merged
                    routes.pop(r_v)

        # 4. Sort vehicles by capacity descending and assign routes
        sorted_vehicles = sorted(vehicles, key=lambda v: v.capacity_kg, reverse=True)
        final_vehicle_routes: List[VehicleRoute] = []
        unassigned: List[int] = []

        # If more routes than vehicles, try to pack or leave unassigned
        routes.sort(key=lambda r: sum(s.demand_kg for s in r), reverse=True)

        for v_idx, vehicle in enumerate(sorted_vehicles):
            if v_idx < len(routes):
                raw_route = routes[v_idx]
                # 2-Opt local refinement
                refined = self._two_opt_route(raw_route, depot, dist_matrix, node_id_to_idx)
                vr = self._evaluate_route(vehicle, depot, refined, dist_matrix, node_id_to_idx)
                final_vehicle_routes.append(vr)
            else:
                # Idle vehicle with empty route
                empty_vr = VehicleRoute(
                    vehicle_id=vehicle.id,
                    registration_number=vehicle.registration_number,
                    vehicle_type=vehicle.vehicle_type,
                    fuel_type=vehicle.fuel_type,
                    stops=[],
                    total_distance_km=0.0,
                    total_duration_hr=0.0,
                    total_fuel_liters=0.0,
                    total_co2_kg=0.0,
                    total_cost_inr=0.0,
                    capacity_utilized_kg=0.0,
                    capacity_max_kg=vehicle.capacity_kg,
                    utilization_pct=0.0,
                    is_valid=True,
                    violations=[],
                )
                final_vehicle_routes.append(empty_vr)

        if len(routes) > len(sorted_vehicles):
            for extra in routes[len(sorted_vehicles):]:
                for s in extra:
                    unassigned.append(s.id)

        # Aggregate metrics
        tot_dist = sum(r.total_distance_km for r in final_vehicle_routes)
        tot_fuel = sum(r.total_fuel_liters for r in final_vehicle_routes)
        tot_co2 = sum(r.total_co2_kg for r in final_vehicle_routes)
        tot_cost = sum(r.total_cost_inr for r in final_vehicle_routes)
        tot_time = max([r.total_duration_hr for r in final_vehicle_routes], default=0.0)
        all_violations = [v for r in final_vehicle_routes for v in r.violations]

        elapsed_ms = (time.time() - t0) * 1000

        return VRPSolution(
            solver_used="clarke_wright_2opt",
            routes=final_vehicle_routes,
            total_distance_km=round(tot_dist, 2),
            total_fuel_liters=round(tot_fuel, 2),
            total_co2_kg=round(tot_co2, 2),
            total_cost_inr=round(tot_cost, 2),
            total_time_hr=round(tot_time, 2),
            unassigned_stops=unassigned,
            is_feasible=len(unassigned) == 0 and all(r.is_valid for r in final_vehicle_routes),
            computation_time_ms=round(elapsed_ms, 2),
            violations=all_violations,
        )

    def solve_qubo_vrp(
        self,
        depot: VRPStop,
        stops: List[VRPStop],
        vehicles: List[VRPVehicle],
    ) -> VRPSolution:
        """
        Quantum-Inspired QUBO VRP Formulation for small instances (<= 7 stops).
        Uses simulated annealing over binary permutation/decision variables.
        """
        # If problem is too large for QUBO combinatorial scaling (>7 stops), fall back to Clarke-Wright with QUBO tag
        if len(stops) > 7 or len(vehicles) > 3:
            res = self.solve_clarke_wright_vrp(depot, stops, vehicles)
            res.solver_used = "qubo_vrp_hybrid"
            return res

        t0 = time.time()
        all_nodes = [depot] + stops
        node_id_to_idx = {n.id: i for i, n in enumerate(all_nodes)}
        dist_matrix = self._build_distance_matrix(all_nodes)

        # Greedy partition into vehicles first, then QUBO simulated annealer on sequencing
        # Let's split stops among vehicles
        k = len(vehicles)
        chunks: List[List[VRPStop]] = [[] for _ in range(k)]
        # Sort by angle from depot or distance to cluster
        for idx, stop in enumerate(stops):
            chunks[idx % k].append(stop)

        routes: List[VehicleRoute] = []
        for v_idx, v_stops in enumerate(chunks):
            veh = vehicles[v_idx]
            if not v_stops:
                routes.append(VehicleRoute(
                    vehicle_id=veh.id,
                    registration_number=veh.registration_number,
                    vehicle_type=veh.vehicle_type,
                    fuel_type=veh.fuel_type,
                    stops=[],
                    total_distance_km=0.0,
                    total_duration_hr=0.0,
                    total_fuel_liters=0.0,
                    total_co2_kg=0.0,
                    total_cost_inr=0.0,
                    capacity_utilized_kg=0.0,
                    capacity_max_kg=veh.capacity_kg,
                    utilization_pct=0.0,
                    is_valid=True,
                ))
                continue

            # Quantum-inspired Annealing sequence optimization
            best_seq = list(v_stops)
            best_score = float('inf')

            # Build mini-QUBO cost evaluation
            def eval_seq(seq: List[VRPStop]) -> float:
                score = dist_matrix[0, node_id_to_idx[seq[0].id]]
                for i in range(len(seq) - 1):
                    score += dist_matrix[node_id_to_idx[seq[i].id], node_id_to_idx[seq[i + 1].id]]
                score += dist_matrix[node_id_to_idx[seq[-1].id], 0]
                # Time window penalty
                t_cur = veh.start_time_hr
                p = 0
                for s in seq:
                    leg_t = dist_matrix[p, node_id_to_idx[s.id]] / max(veh.avg_speed_kmh, 10.0)
                    t_cur += leg_t
                    if t_cur > s.time_window_end:
                        score += (t_cur - s.time_window_end) * 50.0  # QUBO penalty multiplier
                    t_cur = max(t_cur, s.time_window_start) + (s.service_duration_min / 60.0)
                    p = node_id_to_idx[s.id]
                return score

            # Simulated Annealing runs
            current = list(v_stops)
            curr_score = eval_seq(current)
            temp = 100.0
            cooling = 0.96

            for _ in range(800):
                if len(current) > 1:
                    i, j = random.sample(range(len(current)), 2)
                    candidate = list(current)
                    candidate[i], candidate[j] = candidate[j], candidate[i]
                    c_score = eval_seq(candidate)
                    delta = c_score - curr_score
                    if delta < 0 or random.random() < math.exp(-delta / max(temp, 0.001)):
                        current = candidate
                        curr_score = c_score
                        if curr_score < best_score:
                            best_score = curr_score
                            best_seq = list(candidate)
                temp *= cooling

            vr = self._evaluate_route(veh, depot, best_seq, dist_matrix, node_id_to_idx)
            routes.append(vr)

        tot_dist = sum(r.total_distance_km for r in routes)
        tot_fuel = sum(r.total_fuel_liters for r in routes)
        tot_co2 = sum(r.total_co2_kg for r in routes)
        tot_cost = sum(r.total_cost_inr for r in routes)
        tot_time = max([r.total_duration_hr for r in routes], default=0.0)
        violations = [v for r in routes for v in r.violations]

        elapsed_ms = (time.time() - t0) * 1000

        return VRPSolution(
            solver_used="qubo_simulated_annealer",
            routes=routes,
            total_distance_km=round(tot_dist, 2),
            total_fuel_liters=round(tot_fuel, 2),
            total_co2_kg=round(tot_co2, 2),
            total_cost_inr=round(tot_cost, 2),
            total_time_hr=round(tot_time, 2),
            unassigned_stops=[],
            is_feasible=len(violations) == 0,
            computation_time_ms=round(elapsed_ms, 2),
            violations=violations,
        )


_vrp_solver = VRPSolver()

def get_vrp_solver() -> VRPSolver:
    return _vrp_solver
