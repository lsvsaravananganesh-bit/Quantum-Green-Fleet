import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.models import user, vehicle, driver, trip, fuel, optimization, prediction
from app.models.user import User
from app.api import (
    auth, dashboard, vehicles, drivers, trips,
    prediction as pred_api, optimization as opt_api, alerts,
    vrp, research, digital_twin, maintenance, ev, ml_drift, intelligence
)
from app.ml.predictor import init_predictor


def ensure_demo_user():
    db = SessionLocal()
    try:
        demo_user = db.query(User).filter(User.email == "admin@fleet.com").first()
        if demo_user is None:
            db.add(
                User(
                    email="admin@fleet.com",
                    password_hash=get_password_hash("admin123"),
                    full_name="Fleet Administrator",
                    role="admin",
                    is_active=True,
                )
            )
        else:
            demo_user.password_hash = get_password_hash("admin123")
            demo_user.full_name = demo_user.full_name or "Fleet Administrator"
            demo_user.role = "admin"
            demo_user.is_active = True
        db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[START] Starting Quantum Green Fleet API...")
    Base.metadata.create_all(bind=engine)
    ensure_demo_user()
    print("[OK] Database tables ready")

    models_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "models")
    )
    init_predictor(models_dir)
    yield
    print("Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## Quantum-Inspired Fuel Consumption Prediction & Green Fleet Optimization API

A complete fleet management backend with:
- 🤖 ML-based fuel consumption prediction (Random Forest, XGBoost, etc.)
- ⚛️ Quantum-inspired QUBO optimization for vehicle-trip assignment
- 🚗 Full fleet, vehicle, driver, and trip management
- 📊 Analytics, emissions, and cost reporting

**Demo credentials:** admin@fleet.com / admin123
    """,
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(vehicles.router)
app.include_router(drivers.router)
app.include_router(trips.router)
app.include_router(pred_api.router)
app.include_router(opt_api.router)
app.include_router(alerts.router)
app.include_router(vrp.router)
app.include_router(research.router)
app.include_router(digital_twin.router)
app.include_router(maintenance.router)
app.include_router(ev.router)
app.include_router(ml_drift.router)
app.include_router(intelligence.router)


@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "app": settings.APP_NAME,
    }


@app.get("/", tags=["System"])
def root():
    return {
        "message": "Quantum Green Fleet API is running",
        "docs": "/docs",
        "health": "/health",
    }
