
from pathlib import Path

import joblib
import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
TS_PATH = ROOT / "outputs" / "timeseries.csv"

LAG_VALUES = [1, 2, 3, 6, 12]


def _models():
    cpu_bundle = joblib.load(
        ROOT / "models" / "cpu_usage_model.pkl"
    )

    mem_bundle = joblib.load(
        ROOT / "models" / "memory_usage_model.pkl"
    )

    return (
        cpu_bundle,
        mem_bundle,
    )


def _make_features(ts):
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

        x[f"{col}_roll3"] = (
            x[col]
            .shift(1)
            .rolling(3)
            .mean()
        )

        x[f"{col}_roll12"] = (
            x[col]
            .shift(1)
            .rolling(12)
            .mean()
        )

    return x


def _predict(
    row,
    cpu_bundle,
    mem_bundle
):
    cpu_model = cpu_bundle["model"]
    mem_model = mem_bundle["model"]

    cpu_features = cpu_bundle["features"]
    mem_features = mem_bundle["features"]

    cpu_X = pd.DataFrame(
        [[row.get(c, 0.0) for c in cpu_features]],
        columns=cpu_features
    )

    mem_X = pd.DataFrame(
        [[row.get(c, 0.0) for c in mem_features]],
        columns=mem_features
    )

    predicted_cpu = float(
        cpu_model.predict(cpu_X)[0]
    )

    predicted_memory = float(
        mem_model.predict(mem_X)[0]
    )

    return {
        "predicted_cpu": max(0.0, predicted_cpu),
        "predicted_memory": max(0.0, predicted_memory),
    }


def forecast_latest():

    df = pd.read_csv(
        TS_PATH,
        parse_dates=["timestamp"]
    )

    cpu_bundle, mem_bundle = _models()

    current = df.iloc[-1].copy()

    future = current.copy()

    future["timestamp"] = (
        current["timestamp"]
        + pd.Timedelta(minutes=5)
    )

    augmented = pd.concat(
        [
            df,
            pd.DataFrame([future])
        ],
        ignore_index=True
    )

    features = _make_features(
        augmented
    )

    row = features.iloc[-1]

    prediction = _predict(
        row,
        cpu_bundle,
        mem_bundle
    )

    return {
        "timestamp": str(
            future["timestamp"]
        ),
        **prediction,
        "current_cpu": float(
            current["cpu_usage"]
        ),
        "current_memory": float(
            current["memory_usage"]
        ),
    }


def forecast_from_input(
    cpu,
    memory,
    workloads,
    assigned_memory
):

    df = pd.read_csv(
        TS_PATH,
        parse_dates=["timestamp"]
    )

    cpu_bundle, mem_bundle = _models()

    current = df.iloc[-1].copy()

    # --------------------------------------------------
    # USER INPUT IS THE CURRENT WORKLOAD STATE
    # --------------------------------------------------

    user_state = current.copy()

    user_state["timestamp"] = (
        current["timestamp"]
        + pd.Timedelta(minutes=1)
    )

    user_state["cpu_usage"] = float(cpu)
    user_state["memory_usage"] = float(memory)
    user_state["workload_count"] = float(workloads)
    user_state["assigned_memory"] = float(
        assigned_memory
    )

    # Keep hidden signals connected to the scenario.
    user_state["peak_cpu"] = max(
        float(cpu),
        float(current.get("peak_cpu", cpu))
    )

    user_state["peak_memory"] = max(
        float(memory),
        float(current.get("peak_memory", memory))
    )

    user_state["requested_cpu"] = float(cpu)
    user_state["requested_memory"] = float(memory)

    # --------------------------------------------------
    # FUTURE ROW
    # --------------------------------------------------

    future_state = user_state.copy()

    future_state["timestamp"] = (
        user_state["timestamp"]
        + pd.Timedelta(minutes=5)
    )

    # --------------------------------------------------
    # BUILD FEATURES
    # --------------------------------------------------

    augmented = pd.concat(
        [
            df,
            pd.DataFrame([user_state]),
            pd.DataFrame([future_state])
        ],
        ignore_index=True
    )

    features = _make_features(
        augmented
    )

    # Last row = next 5-minute forecast
    row = features.iloc[-1]

    prediction = _predict(
        row,
        cpu_bundle,
        mem_bundle
    )

    # --------------------------------------------------
    # SAFETY / SCENARIO ADJUSTMENT
    #
    # Random Forest cannot extrapolate outside
    # the historical training range.
    #
    # If user enters a value much larger than the
    # historical workload, use the current scenario
    # as the forecast anchor instead of returning an
    # unrelated small historical value.
    # --------------------------------------------------

    cpu_training_max = float(
        cpu_bundle.get(
            "training_max",
            {}
        ).get(
            "cpu_usage",
            float(cpu)
        )
    )

    memory_training_max = float(
        mem_bundle.get(
            "training_max",
            {}
        ).get(
            "memory_usage",
            float(memory)
        )
    )

    predicted_cpu = prediction[
        "predicted_cpu"
    ]

    predicted_memory = prediction[
        "predicted_memory"
    ]

    # CPU outside learned range
    if cpu > cpu_training_max * 1.5:

        recent_cpu = float(
            df["cpu_usage"]
            .tail(12)
            .mean()
        )

        if recent_cpu > 0:

            trend_ratio = (
                float(
                    df["cpu_usage"]
                    .tail(6)
                    .mean()
                )
                /
                recent_cpu
            )

            trend_ratio = float(
                np.clip(
                    trend_ratio,
                    0.90,
                    1.20
                )
            )

        else:
            trend_ratio = 1.0

        predicted_cpu = cpu * trend_ratio

    # Memory outside learned range
    if memory > memory_training_max * 1.5:

        recent_memory = float(
            df["memory_usage"]
            .tail(12)
            .mean()
        )

        if recent_memory > 0:

            trend_ratio = (
                float(
                    df["memory_usage"]
                    .tail(6)
                    .mean()
                )
                /
                recent_memory
            )

            trend_ratio = float(
                np.clip(
                    trend_ratio,
                    0.90,
                    1.20
                )
            )

        else:
            trend_ratio = 1.0

        predicted_memory = (
            memory * trend_ratio
        )

    return {
        "predicted_cpu": float(
            max(0.0, predicted_cpu)
        ),

        "predicted_memory": float(
            max(0.0, predicted_memory)
        ),

        "next_window":
            "Next 5-minute workload window",

        "model":
            "Random Forest next-window forecasting",

        "context_cpu":
            float(cpu),

        "context_memory":
            float(memory),

        "context_workloads":
            float(workloads),

        "assigned_memory":
            float(assigned_memory),
    }
