# 🌿 Quantum Green Fleet: Research & Operational Intelligence Platform

> **Quantum-Inspired Fuel Consumption Prediction, Multi-Objective Pareto Optimization, and Green Fleet Operational Intelligence**

Quantum Green Fleet is a state-of-the-art AI, operations research, and quantum-inspired fleet management system. It integrates high-fidelity ML regressors, QUBO combinatorial solvers, Clarke-Wright CVRPTW heuristics, discrete-event digital twin simulation, adaptive ML drift tracking, and electric vehicle life-cycle analytics.

---

## 🌟 13 Operational & Research Intelligence Modules

### 1. Multi-Stop Vehicle Routing Problem (CVRPTW) (`/vrp`)
- **Capacity & Time Windows**: Clarke-Wright Savings algorithm paired with 2-Opt local search refinement.
- **Quantum-Inspired Formulation**: Formulates route customer sequences as an unconstrained binary quadratic penalty model solved via simulated annealing.
- **Interactive Routing Visualizer**: Multi-depot delivery clusters, stop sequence tags, arrival schedules, and capacity utilization meters.

### 2. Multi-Objective Quantum Pareto Optimization (`/pareto`)
- **5-Objective Simultaneous Tradeoff**: Fuel Consumption ($L$), Carbon Emissions ($kg\ CO_2$), Total Travel Duration ($min$), Operating Cost ($\text{₹}$), and Fleet Wear/Tear Index.
- **Interactive Sliders**: Dynamically adjusts normalized weighting vector $\sum w_i = 1$ with auto-rebalancing.
- **Pareto Frontier**: Explores non-dominated Pareto solutions with interactive hypervolume and tradeoff visualizations.

### 3. Quantum-Inspired Benchmarking Suite (`/benchmark`)
- **5 Comparative Algorithms**:
  1. Classical Greedy Heuristic
  2. Hungarian Algorithm (Kuhn-Munkres LSAP via `scipy.optimize.linear_sum_assignment`)
  3. Genetic Algorithm (Crossover + Mutation)
  4. Classical Simulated Annealing
  5. Simulated Quantum Annealing (Transverse-Field Hamiltonian Driver with quantum tunneling emulation)
- **Scientific Dispersion**: Runs across multi-seed iterations with Mean, Std Dev, Min/Max energy, and Box Plot dispersion metrics.

### 4. Interactive QUBO Visualizer & Formulation Explorer (`/qubo`)
- **Matrix Heatmap**: Interactive $N \times N$ coefficient matrix displaying diagonal linear weights and off-diagonal quadratic coupling interactions $Q_{ij}$.
- **Dynamic Energy Calculator**: Interactive bitstring toggler computing $E(x) = x^T Q x = \sum_i Q_{ii}x_i + \sum_{i < j} Q_{ij}x_i x_j$ in real time with penalty decomposition.

### 5. Fleet Digital Twin & Stochastic Simulation (`/digital-twin`)
- **Discrete-Event Simulation**: 24-hour operational fleet timeline with log-normal traffic congestion multipliers, weather degradation penalties, and breakdown hazard probabilities.
- **Operational Reality**: Features live synthetic dispatch tracking, hourly incident log, baseline vs optimized comparisons, and prominent `SIMULATED DATA` research badges.

### 6. Fleet Telemetry & Predictive Maintenance (`/maintenance`)
- **Deterioration Scoring**: 0–100% health score derived from sensor telemetry (engine temperature, vibration index, oil pressure, battery health).
- **Rolling Delta Detection**: 10-trip rolling fuel consumption deviation alerting to engine degradation before mechanical failure occurs.
- **Service Countdown**: Remaining operational hours and scheduled maintenance alerts.

### 7. Robust Monte Carlo Optimization & Risk Sensitivity (`/sensitivity`)
- **300+ Perturbation Trials**: Evaluates fleet resilience against stochastic fuel price volatility ($\pm 25\%$), traffic shocks, payload variance, and weather extremes.
- **Risk Metrics**: Value at Risk (VaR 95%), Conditional Value at Risk (CVaR 95%), and Tornado Sensitivity ranking.

### 8. Electric & Hybrid Fleet Electrification (`/ev-fleet`)
- **Dual Energy Accounting**: Side-by-side $kWh/km$ and $L/100km$ telemetry tracking.
- **Thermal Range Derating**: Mathematical ambient temperature penalty modeling battery chemistry efficiency loss in extreme heat/cold.
- **Smart Time-of-Use (ToU) Charging**: Shifts battery recharges to off-peak grid tariff windows.
- **1/3/5-Year TCO Simulator**: Capital expenditure (CapEx) amortized against operational expenditure (OpEx) with break-even horizons.

### 9. Adaptive Machine Learning Drift Monitor (`/ml-drift`)
- **Distribution Shift Tracking**: Population Stability Index (PSI) on key input features (`payload_kg`, `avg_speed_kmh`, `engine_cc`).
- **Residual Drift**: Real-time error metric degradation tracking ($MAE$, $RMSE$, $R^2$).
- **Model Registry**: Champion vs Challenger deployment pipeline with automated promotion, canary scoring, and rollback safeguards.

### 10. Advanced Fleet Intelligence & Depot Rebalancing (`/intelligence`)
- **Multi-Depot Inventory Balancing**: Calculates vehicle shortages/surpluses and generates minimum-deadhead vehicle relocation transfers.
- **Fuel Anomaly Detector**: Interquartile Range (IQR) and Z-score outlier detection identifying fuel theft, sensor faults, or fuel leaks.
- **Driver Eco-Scoring**: Evaluates driver idling ratios, harsh acceleration events, and fuel efficiency adherence.

### 11. Master Operations Cockpit (`/dashboard` & `/intelligence`)
- **Real-Time KPI Strip**: Active vehicles, system efficiency gain, fleet health rating, and cumulative carbon savings.
- **Direct Launchpads**: Fast navigational shortcuts into all research solvers and analytical engines.

### 12. Scientific Research Validator & Experiment Suite (`/research-lab`)
- **Multi-Seed Experiment Runner**: Generates statistically rigorous benchmarks across varying fleet configurations and problem instances.
- **Export Formats**: One-click JSON, CSV dataset exports, and formatted LaTeX/KaTeX scientific reports ready for publication.

### 13. System Integration & Testing Suite
- 17 comprehensive unit & integration tests covering all optimization, ML, and API routers.

---

## 🏗️ Architecture & Technology Stack

```
quantum-green-fleet/
├── backend/                       # Python 3.10+ FastAPI & SQLAlchemy Engine
│   ├── app/
│   │   ├── api/                   # 12 Modular REST Routers
│   │   │   ├── vrp.py             # CVRPTW endpoints
│   │   │   ├── research.py        # Benchmark, Pareto, QUBO, Sensitivity
│   │   │   ├── digital_twin.py    # Discrete-event simulation
│   │   │   ├── maintenance.py     # Predictive maintenance & telemetry
│   │   │   ├── ev.py              # EV dual accounting & TCO
│   │   │   ├── ml_drift.py        # PSI drift & model registry
│   │   │   ├── intelligence.py    # Depot rebalancing & anomaly detection
│   │   │   └── ... (auth, vehicles, trips, optimization)
│   │   ├── core/                  # Security (JWT, bcrypt), SQLite configuration
│   │   ├── ml/                    # XGBoost, drift monitoring, feature stores
│   │   ├── models/                # SQLAlchemy models (Vehicle, Driver, Trip, User, Alert)
│   │   ├── optimization/          # 11 Algorithm Solvers & Mathematical Models
│   │   └── schemas/               # Pydantic v2 validation contracts
│   └── tests/                     # Automated unittest suite (17 comprehensive tests)
├── frontend/                      # React 18, TypeScript, Tailwind CSS, Vite
│   ├── src/
│   │   ├── components/            # AppLayout, Sidebar, Navbar, Badges
│   │   ├── pages/                 # 27 Interactive Pages (Research & Operations)
│   │   ├── services/              # Axios typed API clients
│   │   └── types/                 # TypeScript interfaces
├── models/                        # Pre-trained models (XGBoost, Random Forest)
├── datasets/                      # 3,000 calibrated fleet telemetry samples
└── quantum_fleet.db               # SQLite operational database
```

---

## 🚀 Quickstart Guide

### Prerequisites
- Python 3.10+ (with pip)
- Node.js 18+ (with npm)

### 1. Backend Setup & Startup

Open a terminal in the project root:

```powershell
# Navigate to backend
cd backend

# (Optional: If database is fresh)
python scripts/init_db.py
python scripts/seed_data.py

# Run FastAPI server (Windows PowerShell)
$env:PYTHONUTF8=1
python -m uvicorn app.main:app --reload --port 8000
```

> **API Documentation**: The interactive OpenAPI Swagger UI is available at **http://localhost:8000/docs**.

### 2. Frontend Setup & Startup

Open a second terminal:

```powershell
# Navigate to frontend
cd frontend

# Install dependencies (first time only)
npm install

# Start Vite development server
npm run dev
```

> **Web Application**: Access the dashboard at **http://localhost:5173**.

---

## 🔑 Demo Credentials

| Role | Email | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@fleet.com` | `admin123` | Full access: All research labs, ML registry, system settings |
| **Fleet Manager** | `manager@fleet.com` | `manager123` | Operational access: Dispatches, VRP routing, digital twin |

*(Quick-login one-click buttons are provided on the login page)*

---

## 🧪 Automated Testing

To run the complete backend test suite:

```powershell
cd backend
$env:PYTHONUTF8=1
python -m unittest discover -s tests -v
```

All 17 tests verify:
- API Health & Database connectivity
- JWT Authentication & RBAC security
- Vehicle, Driver, and Trip CRUD
- Machine Learning Regressors & Fuel Inference
- QUBO Simulated Annealing Optimization
- Clarke-Wright CVRPTW Solver
- Pareto Multi-Objective Optimization
- 5-Algorithm Benchmarking Suite
- QUBO Matrix Decomposition
- Stochastic Digital Twin Simulation
- Predictive Maintenance & Component Wear
- Monte Carlo Sensitivity & Risk VaR/CVaR
- EV Range Derating & Smart ToU Charging
- ML Feature PSI Drift & Model Registry
- Depot Rebalancing & IQR Fuel Anomaly Detection
