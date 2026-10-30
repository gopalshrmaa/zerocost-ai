import ast
import os
import numpy as np
import pandas as pd

BIN_MINUTES = 5
BIN_US = BIN_MINUTES * 60 * 1_000_000

def parse_resource(value):
    if not isinstance(value, str):
        return (np.nan, np.nan)
    try:
        d = ast.literal_eval(value)
        return (float(d.get("cpus", np.nan) or 0), float(d.get("memory", np.nan) or 0))
    except Exception:
        return (np.nan, np.nan)

def build_timeseries(csv_path, out_path):
    usecols = [
        "start_time", "average_usage", "maximum_usage",
        "resource_request", "assigned_memory", "cluster", "failed"
    ]
    df = pd.read_csv(csv_path, usecols=usecols)

    avg = df["average_usage"].map(parse_resource)
    mx = df["maximum_usage"].map(parse_resource)
    req = df["resource_request"].map(parse_resource)

    df["avg_cpu"] = avg.map(lambda x: x[0])
    df["avg_memory"] = avg.map(lambda x: x[1])
    df["max_cpu"] = mx.map(lambda x: x[0])
    df["max_memory"] = mx.map(lambda x: x[1])
    df["requested_cpu"] = req.map(lambda x: x[0])
    df["requested_memory"] = req.map(lambda x: x[1])

    df = df.replace([np.inf, -np.inf], np.nan)
    df = df.dropna(subset=["start_time", "avg_cpu", "avg_memory"])
    df["start_time"] = pd.to_numeric(df["start_time"], errors="coerce")
    df = df.dropna(subset=["start_time"])

    # Ignore impossible sentinel timestamps.
    df = df[df["start_time"] >= 0]
    df["time_bin"] = (df["start_time"] // BIN_US).astype("int64")

    agg = df.groupby("time_bin", as_index=False).agg(
        cpu_usage=("avg_cpu", "sum"),
        memory_usage=("avg_memory", "sum"),
        peak_cpu=("max_cpu", "sum"),
        peak_memory=("max_memory", "sum"),
        requested_cpu=("requested_cpu", "sum"),
        requested_memory=("requested_memory", "sum"),
        assigned_memory=("assigned_memory", "sum"),
        workload_count=("avg_cpu", "size"),
        failed_count=("failed", "sum"),
    )

    agg["timestamp"] = pd.to_datetime(
        agg["time_bin"] * BIN_US, unit="us", origin="unix"
    )
    agg = agg.sort_values("timestamp").reset_index(drop=True)
    agg.to_csv(out_path, index=False)
    return agg

if __name__ == "__main__":
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    build_timeseries(
        os.path.join(root, "data", "borg_traces_data.csv"),
        os.path.join(root, "outputs", "timeseries.csv")
    )
    print("Created outputs/timeseries.csv")
