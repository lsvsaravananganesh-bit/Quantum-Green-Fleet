"""
Seed database with realistic demo data.
Run after init_db.py: python scripts/seed_data.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta, date
import random
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.fuel import FuelRecord, FuelPrice
from app.models.prediction import Alert

random.seed(42)

CITIES = [
    ("Mumbai", "Delhi", 1400), ("Delhi", "Bangalore", 2150), ("Chennai", "Hyderabad", 630),
    ("Pune", "Nashik", 210), ("Mumbai", "Pune", 150), ("Bangalore", "Chennai", 345),
    ("Hyderabad", "Pune", 560), ("Delhi", "Jaipur", 280), ("Kolkata", "Bhubaneswar", 445),
    ("Mumbai", "Ahmedabad", 525), ("Surat", "Vadodara", 130), ("Coimbatore", "Chennai", 500),
    ("Nagpur", "Raipur", 290), ("Indore", "Bhopal", 195), ("Lucknow", "Kanpur", 80),
    ("Agra", "Delhi", 210), ("Chandigarh", "Delhi", 250), ("Jaipur", "Udaipur", 395),
]

VEHICLE_DATA = [
    ("TN01AB1234", "truck",  "Tata",       "Prima 4028",    2019, "diesel",  3800, 12000, 200, 6.5),
    ("MH04CD5678", "van",    "Mahindra",   "Supro",         2021, "petrol",  1200, 1100,  35,  16.0),
    ("KA03EF9012", "car",    "Toyota",     "Innova",        2022, "diesel",  2500, 2000,  55,  12.5),
    ("DL05GH3456", "truck",  "Ashok Leyland","Boss",        2018, "diesel",  4200, 14000, 220, 5.8),
    ("GJ06IJ7890", "van",    "Force",      "Traveller",     2020, "diesel",  2500, 2800,  60,  11.5),
    ("RJ07KL2345", "car",    "Maruti",     "Swift Dzire",   2023, "petrol",  1200, 1100,  40,  22.0),
    ("WB08MN6789", "bus",    "Tata",       "Starbus Ultra", 2020, "diesel",  5700, 16000, 400, 4.5),
    ("TS09OP0123", "truck",  "Eicher",     "Pro 6031",      2021, "diesel",  5200, 11000, 180, 7.2),
    ("UP10QR4567", "car",    "Honda",      "City",          2022, "petrol",  1500, 1250,  45,  18.5),
    ("HR11ST8901", "van",    "Tata",       "Ace",           2019, "diesel",  1400, 1500,  50,  14.0),
]

DRIVER_DATA = [
    ("EMP001", "Rajesh Kumar",      "rajesh@fleet.com",   "+91-9876543210", "DL20110012345", 12),
    ("EMP002", "Suresh Patel",      "suresh@fleet.com",   "+91-9876543211", "GJ20150045678", 8),
    ("EMP003", "Amit Singh",        "amit@fleet.com",     "+91-9876543212", "MH20180098765", 6),
    ("EMP004", "Vikram Rao",        "vikram@fleet.com",   "+91-9876543213", "KA20130056789", 10),
    ("EMP005", "Priya Nair",        "priya@fleet.com",    "+91-9876543214", "TN20200023456", 4),
    ("EMP006", "Mohammed Khan",     "mohd@fleet.com",     "+91-9876543215", "DL20160078901", 9),
    ("EMP007", "Sanjay Verma",      "sanjay@fleet.com",   "+91-9876543216", "UP20120034567", 11),
    ("EMP008", "Kavitha Reddy",     "kavitha@fleet.com",  "+91-9876543217", "TS20190067890", 5),
]


def seed():
    db = SessionLocal()
    try:
        # Users
        if db.query(User).count() == 0:
            admin = User(
                email="admin@fleet.com",
                password_hash=get_password_hash("admin123"),
                full_name="Fleet Administrator",
                role="admin",
            )
            manager = User(
                email="manager@fleet.com",
                password_hash=get_password_hash("manager123"),
                full_name="Fleet Manager",
                role="fleet_manager",
            )
            db.add_all([admin, manager])
            db.commit()
            print("✓ Users seeded")

        # Fuel Prices
        if db.query(FuelPrice).count() == 0:
            db.add_all([
                FuelPrice(fuel_type="petrol", price_per_liter_inr=103.5, effective_date=date(2024, 9, 1)),
                FuelPrice(fuel_type="diesel", price_per_liter_inr=90.25, effective_date=date(2024, 9, 1)),
                FuelPrice(fuel_type="electric", price_per_liter_inr=8.0, effective_date=date(2024, 9, 1)),
            ])
            db.commit()
            print("✓ Fuel prices seeded")

        # Drivers
        drivers = []
        if db.query(Driver).count() == 0:
            for emp_id, name, email, phone, lic, exp in DRIVER_DATA:
                d = Driver(
                    employee_id=emp_id,
                    full_name=name,
                    email=email,
                    phone=phone,
                    license_number=lic,
                    license_expiry=date(2028, random.randint(1, 12), 15),
                    experience_years=exp,
                    status="active",
                )
                db.add(d)
                drivers.append(d)
            db.commit()
            drivers = db.query(Driver).all()
            print("✓ Drivers seeded")
        else:
            drivers = db.query(Driver).all()

        # Vehicles
        vehicles = []
        if db.query(Vehicle).count() == 0:
            for idx, vdata in enumerate(VEHICLE_DATA):
                reg, vtype, mfr, model, yr, ft, eng, wt, tank, mileage = vdata
                driver = drivers[idx] if idx < len(drivers) else None
                statuses = ["available", "available", "in_use", "available", "available",
                           "in_use", "available", "maintenance", "available", "available"]
                v = Vehicle(
                    registration_number=reg,
                    vehicle_type=vtype,
                    manufacturer=mfr,
                    model=model,
                    year=yr,
                    fuel_type=ft,
                    engine_cc=eng,
                    weight_kg=wt,
                    tank_capacity_liters=tank,
                    baseline_mileage_kmpl=mileage,
                    odometer_km=random.randint(15000, 150000),
                    status=statuses[idx],
                    assigned_driver_id=driver.id if driver else None,
                )
                db.add(v)
                vehicles.append(v)
            db.commit()
            vehicles = db.query(Vehicle).all()
            print("✓ Vehicles seeded")
        else:
            vehicles = db.query(Vehicle).all()

        # Trips
        if db.query(Trip).count() == 0:
            EMISSION_FACTORS = {"petrol": 2.31, "diesel": 2.68, "hybrid": 1.85, "electric": 0.0}
            PRICES = {"petrol": 103.5, "diesel": 90.25, "electric": 8.0}

            codes = set()
            trips_created = 0
            base_date = datetime.utcnow() - timedelta(days=60)

            for day_offset in range(60):
                day = base_date + timedelta(days=day_offset)
                for _ in range(random.randint(1, 3)):
                    if trips_created >= 80:
                        break
                    origin, dest, dist = random.choice(CITIES)
                    dist += random.randint(-30, 50)
                    dist = max(50, dist)

                    v = random.choice(vehicles)
                    d = random.choice(drivers)
                    traffic = random.choice(["low", "medium", "high"])
                    road = random.choice(["highway", "urban", "mixed"])
                    payload = random.uniform(0, 5000) if v.vehicle_type in ["truck", "van"] else random.uniform(0, 200)

                    # Estimate fuel with simple formula
                    eff = (v.baseline_mileage_kmpl or 12) * {
                        "low": 1.05, "medium": 0.95, "high": 0.80
                    }[traffic] * {"highway": 1.1, "urban": 0.85, "mixed": 1.0}[road]
                    est_fuel = dist / max(eff, 0.1)

                    # Status based on day offset
                    if day_offset < 50:
                        status = "completed"
                        actual_fuel = est_fuel * random.uniform(0.90, 1.12)
                    elif day_offset < 58:
                        status = "active"
                        actual_fuel = None
                    else:
                        status = "planned"
                        actual_fuel = None

                    code = f"TR-{day.strftime('%Y%m%d')}-{trips_created+1:03d}"
                    while code in codes:
                        code += "X"
                    codes.add(code)

                    departure = day.replace(hour=random.randint(6, 18))
                    speed = random.uniform(40, 90)
                    duration = dist / speed * 60

                    trip = Trip(
                        trip_code=code,
                        vehicle_id=v.id,
                        driver_id=d.id,
                        origin=origin,
                        destination=dest,
                        distance_km=round(dist, 1),
                        scheduled_departure=departure,
                        actual_departure=departure + timedelta(minutes=random.randint(-10, 30)) if status != "planned" else None,
                        scheduled_arrival=departure + timedelta(hours=dist / 70),
                        actual_arrival=departure + timedelta(hours=dist / speed) if status == "completed" else None,
                        status=status,
                        expected_fuel_liters=round(est_fuel, 2),
                        actual_fuel_liters=round(actual_fuel, 2) if actual_fuel else None,
                        fuel_cost_inr=round(actual_fuel * PRICES.get(v.fuel_type, 103.5), 2) if actual_fuel else None,
                        co2_emissions_kg=round(actual_fuel * EMISSION_FACTORS.get(v.fuel_type, 2.31), 2) if actual_fuel else None,
                        traffic_condition=traffic,
                        weather_condition=random.choice(["clear", "cloudy", "rain", "clear", "clear"]),
                        payload_kg=round(payload, 0),
                        avg_speed_kmh=round(speed, 1),
                        idle_time_min=round(random.uniform(5, 40), 1),
                        road_type=road,
                    )
                    db.add(trip)
                    trips_created += 1

            db.commit()
            print(f"✓ {trips_created} trips seeded")

        # Alerts
        if db.query(Alert).count() == 0:
            alert_data = [
                ("high_consumption", "warning", vehicles[0].id if vehicles else None, None,
                 "Vehicle TN01AB1234 consumed 18% more fuel than expected on last trip"),
                ("maintenance_due", "critical", vehicles[7].id if len(vehicles) > 7 else None, None,
                 "Vehicle HR11ST8901 is due for scheduled maintenance (overdue by 2000 km)"),
                ("missing_data", "info", None, None,
                 "5 trips are missing actual fuel consumption data"),
                ("high_consumption", "warning", vehicles[3].id if len(vehicles) > 3 else None, None,
                 "Vehicle DL05GH3456 has a 15% efficiency drop over last 10 trips"),
            ]
            for atype, sev, vid, tid, msg in alert_data:
                db.add(Alert(
                    alert_type=atype,
                    severity=sev,
                    vehicle_id=vid,
                    trip_id=tid,
                    message=msg,
                ))
            db.commit()
            print("✓ Alerts seeded")

        print("\n✅ Seed data complete!")
        print("   admin@fleet.com / admin123")
        print("   manager@fleet.com / manager123")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
