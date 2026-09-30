import unittest
import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestFleetAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from app.ml.predictor import init_predictor
        from app.core.config import settings
        from app.core.database import SessionLocal
        from app.models.trip import Trip
        from app.models.vehicle import Vehicle

        init_predictor(settings.MODELS_DIR)

        db = SessionLocal()
        planned_count = db.query(Trip).filter(Trip.status == "planned").count()
        if planned_count == 0:
            trip = Trip(
                trip_code="TR-TEST-PLAN-01",
                origin="Mumbai",
                destination="Pune",
                distance_km=150.0,
                status="planned",
                payload_kg=500.0,
                traffic_condition="medium",
                road_type="highway",
            )
            db.add(trip)
            v = db.query(Vehicle).first()
            if v:
                v.status = "available"
            db.commit()
        db.close()

    def test_health_check(self):
        response = client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "healthy")

    def test_auth_login(self):
        response = client.post("/api/auth/login", json={
            "email": "admin@fleet.com",
            "password": "admin123"
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["email"], "admin@fleet.com")

    def test_auth_invalid(self):
        response = client.post("/api/auth/login", json={
            "email": "admin@fleet.com",
            "password": "wrongpassword"
        })
        self.assertEqual(response.status_code, 401)

    def test_dashboard_summary(self):
        login_res = client.post("/api/auth/login", json={
            "email": "admin@fleet.com",
            "password": "admin123"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        response = client.get("/api/dashboard/summary", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("total_vehicles", data)
        self.assertIn("total_trips", data)
        self.assertGreater(data["total_vehicles"], 0)

    def test_vehicles_list(self):
        login_res = client.post("/api/auth/login", json={
            "email": "admin@fleet.com",
            "password": "admin123"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        response = client.get("/api/vehicles", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertGreater(len(data["data"]), 0)

    def test_fuel_prediction(self):
        login_res = client.post("/api/auth/login", json={
            "email": "admin@fleet.com",
            "password": "admin123"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        payload = {
            "vehicle_type": "truck",
            "fuel_type": "diesel",
            "engine_cc": 4000,
            "weight_kg": 12000,
            "vehicle_age": 4,
            "distance_km": 300,
            "avg_speed_kmh": 65,
            "idle_time_min": 20,
            "road_type": "highway",
            "traffic_condition": "medium",
            "temperature_c": 28,
            "payload_kg": 5000,
        }
        response = client.post("/api/predict/fuel", json=payload, headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(data["predicted_fuel_liters"], 0)
        self.assertGreater(data["predicted_cost_inr"], 0)
        self.assertGreater(data["predicted_co2_kg"], 0)

    def test_optimization_run(self):
        login_res = client.post("/api/auth/login", json={
            "email": "admin@fleet.com",
            "password": "admin123"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        payload = {
            "algorithm": "simulated_annealing",
            "run_name": "Test-QUBO-Run",
            "objective_weights": {"cost": 0.6, "emissions": 0.4}
        }
        response = client.post("/api/optimization/run", json=payload, headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "completed")
        self.assertIn("assignments", data)

    def test_vrp_solve(self):
        login_res = client.post("/api/auth/login", json={"email": "admin@fleet.com", "password": "admin123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        response = client.post("/api/vrp/solve", json={"algorithm": "clarke_wright_2opt"}, headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("routes", data)
        self.assertGreater(len(data["routes"]), 0)

    def test_research_pareto(self):
        login_res = client.post("/api/auth/login", json={"email": "admin@fleet.com", "password": "admin123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        response = client.post("/api/research/pareto", json={"num_samples": 12}, headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("frontier", data)
        self.assertIn("ideal_point", data)

    def test_research_benchmark(self):
        login_res = client.post("/api/auth/login", json={"email": "admin@fleet.com", "password": "admin123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        response = client.post("/api/research/benchmark", json={"num_seeds": 3}, headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("algorithms", data)
        self.assertEqual(len(data["algorithms"]), 5)

    def test_research_qubo_inspect(self):
        login_res = client.post("/api/auth/login", json={"email": "admin@fleet.com", "password": "admin123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        response = client.post("/api/research/qubo-inspect", json={"lambda1": 500, "alpha": 0.6}, headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("matrix_grid", data)
        self.assertIn("default_energy_decomposition", data)

    def test_research_sensitivity(self):
        login_res = client.post("/api/auth/login", json={"email": "admin@fleet.com", "password": "admin123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        response = client.post("/api/research/sensitivity", json={"num_scenarios": 100}, headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("var_95_inr", data)
        self.assertIn("tornado_sensitivity", data)

    def test_digital_twin_simulate(self):
        login_res = client.post("/api/auth/login", json={"email": "admin@fleet.com", "password": "admin123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        response = client.post("/api/digital-twin/simulate", json={"horizon_days": 3}, headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["is_simulation"])
        self.assertIn("timeline", data)

    def test_maintenance_overview(self):
        login_res = client.post("/api/auth/login", json={"email": "admin@fleet.com", "password": "admin123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        response = client.get("/api/maintenance/overview", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("vehicles", data)

    def test_ev_fleet_report(self):
        login_res = client.post("/api/auth/login", json={"email": "admin@fleet.com", "password": "admin123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        response = client.get("/api/ev/fleet-report", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("tco_summary", data)

    def test_ml_drift_report(self):
        login_res = client.post("/api/auth/login", json={"email": "admin@fleet.com", "password": "admin123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        response = client.get("/api/ml-drift/report", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("active_champion", data)
        self.assertIn("psi_metrics", data)

    def test_intelligence_overview(self):
        login_res = client.post("/api/auth/login", json={"email": "admin@fleet.com", "password": "admin123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        response = client.get("/api/intelligence/overview", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("depots", data)
        self.assertIn("fuel_anomalies", data)
        self.assertIn("driver_scores", data)


if __name__ == "__main__":
    unittest.main()
