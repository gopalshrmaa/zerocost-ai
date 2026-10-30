
import os
import sys
import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(ROOT)

from preprocess import build_timeseries


LAG_VALUES = [1, 2, 3, 6, 12]


def make_features(ts):
    x = ts.copy()

    x["hour"] = x["timestamp"].dt.hour
    x["minute"] = x["timestamp"].dt.minute
    x["dayofweek"] = x["timestamp"].dt.dayofweek

    base_cols = [
        "cpu_usage",
        "memory_usage",
        "peak_cpu",
        "peak_memory",
        "requested_cpu",
        "requested_memory",
        "workload_count",
        "assigned_memory",
    ]

    for col in base_cols:
        if col not in x.columns:
            x[col] = 0.0

        for lag in LAG_VALUES:
            x[f"{col}_lag{lag}"] = x[col].shift(lag)

        x[f"{col}_roll3"] = x[col].shift(1).rolling(3).mean()
        x[f"{col}_roll12"] = x[col].shift(1).rolling(12).mean()

    # IMPORTANT:
    # Current CPU and memory are now FEATURES.
    # Target will be the NEXT 5-minute CPU/memory.
    x["target_cpu"] = x["cpu_usage"].shift(-1)
    x["target_memory"] = x["memory_usage"].shift(-1)

    x = x.dropna().reset_index(drop=True)

    feature_cols = [
        c for c in x.columns
        if c not in [
            "timestamp",
            "time_bin",
            "cpu_usage",
            "memory_usage",
            "target_cpu",
            "target_memory",
        ]
    ]

    return x, feature_cols


def train():
    out_dir = os.path.join(ROOT, "outputs")
    model_dir = os.path.join(ROOT, "models")

    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(model_dir, exist_ok=True)

    ts_path = os.path.join(out_dir, "timeseries.csv")

    if not os.path.exists(ts_path):
        print("Building time series...")
        build_timeseries(
            os.path.join(ROOT, "data", "borg_traces_data.csv"),
            ts_path
        )

    ts = pd.read_csv(ts_path, parse_dates=["timestamp"])

    print(f"Loaded {len(ts):,} time-series rows")

    data, features = make_features(ts)

    split = int(len(data) * 0.80)

    train_data = data.iloc[:split]
    test_data = data.iloc[split:]

    X_train = train_data[features]
    X_test = test_data[features]

    results = {}

    targets = {
        "cpu_usage": "target_cpu",
        "memory_usage": "target_memory",
    }

    for model_name, target_col in targets.items():

        print(f"\nTraining {model_name} model...")

        model = RandomForestRegressor(
            n_estimators=300,
            max_depth=18,
            min_samples_leaf=2,
            max_features="sqrt",
            random_state=42,
            n_jobs=-1
        )

        model.fit(
            X_train,
            train_data[target_col]
        )

        predictions = model.predict(X_test)

        predictions = np.maximum(predictions, 0)

        rmse = float(
            np.sqrt(
                mean_squared_error(
                    test_data[target_col],
                    predictions
                )
            )
        )

        results[model_name] = {
            "MAE": float(
                mean_absolute_error(
                    test_data[target_col],
                    predictions
                )
            ),
            "RMSE": rmse,
            "R2": float(
                r2_score(
                    test_data[target_col],
                    predictions
                )
            ),
        }

        model_path = os.path.join(
            model_dir,
            f"{model_name}_model.pkl"
        )

        joblib.dump(
            {
                "model": model,
                "features": features,
                "target": target_col,
                "training_min": X_train.min().to_dict(),
                "training_max": X_train.max().to_dict(),
                "training_median": X_train.median().to_dict(),
            },
            model_path
        )

        prediction_file = os.path.join(
            out_dir,
            f"{model_name}_predictions.csv"
        )

        test_data[
            ["timestamp", target_col]
        ].assign(
            prediction=predictions
        ).to_csv(
            prediction_file,
            index=False
        )

        print(f"MAE  : {results[model_name]['MAE']:.6f}")
        print(f"RMSE : {results[model_name]['RMSE']:.6f}")
        print(f"R2   : {results[model_name]['R2']:.6f}")

    metrics = pd.DataFrame(results).T

    metrics.to_csv(
        os.path.join(
            out_dir,
            "model_metrics.csv"
        )
    )

    print("\n==============================")
    print("MODEL TRAINING COMPLETE")
    print("==============================")
    print(metrics)
    print("\nModels saved successfully.")
    print("Now run: python app.py")


if __name__ == "__main__":
    train()
