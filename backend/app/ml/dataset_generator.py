"""
Synthetic Fleet Fuel Consumption Dataset Generator
Generates 3000 realistic records with physically-based fuel consumption formula.
All data is synthetic and clearly labeled.
"""
import numpy as np
import pandas as pd
import os

np.random.seed(42)


def generate_dataset(n_records: int = 3000, output_path: str = None) -> pd.DataFrame:
    print(f"Generating {n_records} synthetic fuel consumption records...")

    # Vehicle types with realistic distributions
    vehicle_types = np.random.choice(
        ["car", "van", "truck", "bus"],
        size=n_records,
        p=[0.40, 0.30, 0.20, 0.10],
    )

    # Fuel types correlated with vehicle type
    fuel_types = []
    for vt in vehicle_types:
        if vt == "truck":
            fuel_types.append(np.random.choice(["diesel", "petrol"], p=[0.85, 0.15]))
        elif vt == "bus":
            fuel_types.append(np.random.choice(["diesel", "petrol"], p=[0.90, 0.10]))
        elif vt == "van":
            fuel_types.append(np.random.choice(["diesel", "petrol"], p=[0.60, 0.40]))
        else:
            fuel_types.append(np.random.choice(["petrol", "diesel"], p=[0.65, 0.35]))

    # Engine CC correlated with vehicle type
    engine_cc = []
    for vt in vehicle_types:
        if vt == "truck":
            engine_cc.append(np.random.uniform(3500, 6000))
        elif vt == "bus":
            engine_cc.append(np.random.uniform(4000, 7000))
        elif vt == "van":
            engine_cc.append(np.random.uniform(1800, 3500))
        else:
            engine_cc.append(np.random.uniform(1000, 2500))

    # Weight correlated with vehicle type
    weight_kg = []
    for vt in vehicle_types:
        if vt == "truck":
            weight_kg.append(np.random.uniform(5000, 20000))
        elif vt == "bus":
            weight_kg.append(np.random.uniform(8000, 18000))
        elif vt == "van":
            weight_kg.append(np.random.uniform(1800, 4000))
        else:
            weight_kg.append(np.random.uniform(800, 1800))

    vehicle_age = np.random.randint(0, 16, size=n_records)
    distance_km = np.random.uniform(10, 800, size=n_records)
    avg_speed_kmh = np.random.uniform(20, 110, size=n_records)

    traffic_conditions = np.random.choice(
        ["low", "medium", "high"], size=n_records, p=[0.30, 0.45, 0.25]
    )

    # Idle time correlated with traffic
    idle_time_min = []
    for tc in traffic_conditions:
        if tc == "high":
            idle_time_min.append(np.random.uniform(20, 120))
        elif tc == "medium":
            idle_time_min.append(np.random.uniform(5, 40))
        else:
            idle_time_min.append(np.random.uniform(0, 15))

    road_types = np.random.choice(
        ["highway", "urban", "mixed"], size=n_records, p=[0.35, 0.30, 0.35]
    )
    temperature_c = np.random.uniform(-5, 45, size=n_records)

    # Payload correlated with vehicle type
    payload_kg = []
    for vt in vehicle_types:
        if vt == "truck":
            payload_kg.append(np.random.uniform(1000, 15000))
        elif vt == "bus":
            payload_kg.append(np.random.uniform(500, 5000))
        elif vt == "van":
            payload_kg.append(np.random.uniform(200, 2500))
        else:
            payload_kg.append(np.random.uniform(0, 500))

    driving_duration_min = np.array([
        d / s * 60 * np.random.uniform(0.9, 1.2)
        for d, s in zip(distance_km, avg_speed_kmh)
    ])

    # ---- Physically realistic fuel consumption formula ----
    engine_cc_arr = np.array(engine_cc)
    weight_kg_arr = np.array(weight_kg)
    payload_kg_arr = np.array(payload_kg)
    idle_time_arr = np.array(idle_time_min)

    base_consumption = (engine_cc_arr / 1000.0) * 0.07 * distance_km

    speed_factor = 1.0 + 0.35 * np.abs(avg_speed_kmh - 70.0) / 70.0
    weight_factor = 1.0 + (weight_kg_arr - 1200.0) / 60000.0
    payload_factor = 1.0 + payload_kg_arr * 0.00004
    idle_factor = 1.0 + idle_time_arr * 0.004
    temp_factor = 1.0 + np.abs(temperature_c - 22.0) * 0.0015
    age_factor = 1.0 + vehicle_age * 0.007

    traffic_factor_map = {"low": 0.95, "medium": 1.10, "high": 1.30}
    road_factor_map = {"highway": 0.88, "urban": 1.22, "mixed": 1.04}

    tf = np.array([traffic_factor_map[tc] for tc in traffic_conditions])
    rf = np.array([road_factor_map[rt] for rt in road_types])

    fuel_consumed = (
        base_consumption
        * speed_factor
        * weight_factor
        * payload_factor
        * idle_factor
        * tf
        * rf
        * temp_factor
        * age_factor
    )

    # Add realistic measurement noise (5%)
    noise = np.random.normal(0, fuel_consumed * 0.05)
    fuel_consumed = np.clip(fuel_consumed + noise, 1.0, None)

    df = pd.DataFrame({
        "vehicle_type": vehicle_types,
        "fuel_type": fuel_types,
        "engine_cc": np.round(engine_cc_arr, 0).astype(int),
        "weight_kg": np.round(weight_kg_arr, 0).astype(int),
        "vehicle_age": vehicle_age,
        "distance_km": np.round(distance_km, 1),
        "avg_speed_kmh": np.round(avg_speed_kmh, 1),
        "idle_time_min": np.round(idle_time_arr, 1),
        "road_type": road_types,
        "traffic_condition": traffic_conditions,
        "temperature_c": np.round(temperature_c, 1),
        "payload_kg": np.round(payload_kg_arr, 0).astype(int),
        "driving_duration_min": np.round(driving_duration_min, 1),
        "fuel_consumed_liters": np.round(fuel_consumed, 3),
        "data_source": "synthetic",
    })

    if output_path:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        df.to_csv(output_path, index=False)
        print(f"✓ Dataset saved to {output_path}")
        print(f"  Records: {len(df)}")
        print(f"  Fuel range: {df['fuel_consumed_liters'].min():.1f} - {df['fuel_consumed_liters'].max():.1f} L")
        print(f"  Mean fuel: {df['fuel_consumed_liters'].mean():.1f} L")

    return df


if __name__ == "__main__":
    import sys
    script_dir = os.path.dirname(os.path.abspath(__file__))
    datasets_dir = os.path.join(script_dir, "..", "..", "..", "..", "datasets")
    out = os.path.join(datasets_dir, "fleet_fuel_data.csv")
    generate_dataset(3000, out)
