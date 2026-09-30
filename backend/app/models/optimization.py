from app.core.database import Base
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from sqlalchemy.sql import func


class OptimizationRun(Base):
    __tablename__ = "optimization_runs"

    id = Column(Integer, primary_key=True, index=True)
    run_name = Column(String(255), nullable=False)
    algorithm = Column(String(100), nullable=False)  # greedy/linear_assignment/simulated_annealing/qubo_sa
    status = Column(String(50), default="pending")    # pending/running/completed/failed
    objective_value = Column(Float, nullable=True)
    total_fuel_cost_inr = Column(Float, nullable=True)
    total_emissions_kg = Column(Float, nullable=True)
    total_fuel_liters = Column(Float, nullable=True)
    computation_time_ms = Column(Float, nullable=True)
    num_trips = Column(Integer, default=0)
    num_vehicles = Column(Integer, default=0)
    is_feasible = Column(Integer, default=1)  # SQLite boolean as int
    results_json = Column(Text, nullable=True)  # JSON string of full results
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
