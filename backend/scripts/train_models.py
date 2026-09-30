"""Model training script - generates dataset and trains all models."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.ml.dataset_generator import generate_dataset
from app.ml.trainer import train_models

def main():
    # Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(script_dir)
    root_dir = os.path.dirname(backend_dir)

    datasets_dir = os.path.join(root_dir, "datasets")
    models_dir = os.path.join(root_dir, "models")
    csv_path = os.path.join(datasets_dir, "fleet_fuel_data.csv")

    os.makedirs(datasets_dir, exist_ok=True)
    os.makedirs(models_dir, exist_ok=True)

    print("=" * 60)
    print("QUANTUM GREEN FLEET - MODEL TRAINING PIPELINE")
    print("=" * 60)

    # Generate or load dataset
    import pandas as pd
    if os.path.exists(csv_path):
        print(f"\nLoading existing dataset: {csv_path}")
        df = pd.read_csv(csv_path)
        print(f"  Loaded {len(df)} records")
    else:
        print("\nGenerating synthetic dataset...")
        df = generate_dataset(3000, csv_path)

    print(f"\nDataset summary:")
    print(f"  Records: {len(df)}")
    print(f"  Features: {list(df.columns[:-2])}")
    print(f"  Target range: {df['fuel_consumed_liters'].min():.1f} - {df['fuel_consumed_liters'].max():.1f} L")

    print("\nTraining models...")
    metrics = train_models(df, models_dir)

    print("\n" + "=" * 60)
    print("TRAINING COMPLETE - RESULTS")
    print("=" * 60)
    for name, info in metrics["models"].items():
        test = info["test"]
        selected = " [SELECTED]" if info.get("is_selected") else ""
        print(f"\n{name}{selected}:")
        print(f"  Test R2   = {test['r2']:.4f}")
        print(f"  Test MAE  = {test['mae']:.3f} L")
        print(f"  Test RMSE = {test['rmse']:.3f} L")
        print(f"  Test MAPE = {test['mape']:.1f}%")

    print(f"\n[OK] Best model: {metrics['best_model']}")
    print(f"[OK] Models saved to: {models_dir}")

if __name__ == "__main__":
    main()
