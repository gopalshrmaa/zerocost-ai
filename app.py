from flask import Flask, render_template, request, jsonify
import sys, json
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parent
sys.path.append(str(ROOT / "src"))
from forecast import forecast_from_input, forecast_latest
from cost_engine import optimize

app = Flask(__name__)
HISTORY_FILE = ROOT / "outputs" / "prediction_history.json"


def load_history():
    if not HISTORY_FILE.exists():
        return []
    try:
        return json.loads(HISTORY_FILE.read_text(encoding="utf-8"))
    except Exception:
        return []


def save_history(item):
    history = load_history()
    history.insert(0, item)
    HISTORY_FILE.write_text(json.dumps(history[:100], indent=2), encoding="utf-8")


@app.route("/")
def index():
    return render_template("index.html")

@app.route("/prediction")
def prediction():
    return render_template("prediction.html")

@app.route("/multicloud")
def multicloud():
    return render_template("multicloud.html")

@app.route("/history")
def history():
    return render_template("history.html")

@app.route("/analytics")
def analytics():
    return render_template("analytics.html")

@app.route("/settings")
def settings():
    return render_template("settings.html")


@app.get("/api/latest")
def latest():
    try:
        f = forecast_latest()
        o = optimize(f["predicted_cpu"], f["predicted_memory"], f["current_cpu"], f["current_memory"])
        return jsonify({"forecast": f, "optimization": o})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.post("/api/predict")
def predict():
    try:
        d = request.get_json(force=True)
        cpu = float(d["cpu"]); memory = float(d["memory"])
        workloads = int(d["workloads"])
        assigned_memory = float(d.get("assigned_memory", memory))
        if min(cpu, memory, workloads, assigned_memory) < 0:
            raise ValueError("Values cannot be negative.")
        f = forecast_from_input(cpu, memory, workloads, assigned_memory)
        o = optimize(f["predicted_cpu"], f["predicted_memory"], cpu, memory)
        result = {"timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "input": d, "forecast": f, "optimization": o}
        save_history(result)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.get("/api/history")
def api_history():
    return jsonify(load_history())


@app.delete("/api/history")
def clear_history():
    HISTORY_FILE.write_text("[]", encoding="utf-8")
    return jsonify({"ok": True})


@app.post("/api/multicloud")
def api_multicloud():
    try:
        d = request.get_json(force=True)
        cpu = float(d["cpu"]); memory = float(d["memory"])
        workloads = int(d.get("workloads", 0)); assigned_memory = float(d.get("assigned_memory", memory))
        f = forecast_from_input(cpu, memory, workloads, assigned_memory)
        o = optimize(f["predicted_cpu"], f["predicted_memory"], cpu, memory)
       
        providers = {
            "AWS": [
                {"sku":"t3.micro","cpu":2,"memory":1,"price":0.0120},
                {"sku":"t3.small","cpu":2,"memory":2,"price":0.0240},
                {"sku":"t3.medium","cpu":2,"memory":4,"price":0.0480},
                {"sku":"t3.large","cpu":2,"memory":8,"price":0.0960},
                {"sku":"c5.xlarge","cpu":4,"memory":8,"price":0.1150},
                {"sku":"m5.xlarge","cpu":4,"memory":16,"price":0.1920},
                {"sku":"m5.2xlarge","cpu":8,"memory":32,"price":0.3840},
            ],
            "Azure": [
                {"sku":"B1s","cpu":1,"memory":1,"price":0.0100},
                {"sku":"B2s","cpu":2,"memory":4,"price":0.0320},
                {"sku":"D2s v5","cpu":2,"memory":8,"price":0.0700},
                {"sku":"D4s v5","cpu":4,"memory":16,"price":0.1450},
                {"sku":"D8s v5","cpu":8,"memory":32,"price":0.2900},
            ],
            "GCP": [
                {"sku":"e2-small","cpu":2,"memory":2,"price":0.0110},
                {"sku":"e2-medium","cpu":2,"memory":4,"price":0.0340},
                {"sku":"e2-standard-2","cpu":2,"memory":8,"price":0.0650},
                {"sku":"e2-standard-4","cpu":4,"memory":16,"price":0.1280},
                {"sku":"e2-standard-8","cpu":8,"memory":32,"price":0.2500},
            ],
        }

        need_cpu = max(float(o["recommended_cpu"]), 0.1)
        need_memory = max(float(o["recommended_memory"]), 0.1)
        rows = []

        for name, shapes in providers.items():
            suitable = [
                vm for vm in shapes
                if vm["cpu"] >= need_cpu and vm["memory"] >= need_memory
            ]
            vm = suitable[0] if suitable else shapes[-1]
            capacity_ok = vm["cpu"] >= need_cpu and vm["memory"] >= need_memory
            hourly = vm["price"]
            monthly = hourly * 730
            cpu_util = min((need_cpu / vm["cpu"]) * 100, 100)
            memory_util = min((need_memory / vm["memory"]) * 100, 100)
            utilization = (cpu_util + memory_util) / 2

            rows.append({
                "provider": name,
                "sku": vm["sku"],
                "vcpu": vm["cpu"],
                "memory_gb": vm["memory"],
                "hourly": hourly,
                "monthly": monthly,
                "cpu_utilization": cpu_util,
                "memory_utilization": memory_util,
                "utilization": utilization,
                "capacity_ok": capacity_ok,
            })
        valid_rows = [r for r in rows if r["capacity_ok"]]
        if valid_rows:
            min_cost = min(r["monthly"] for r in valid_rows)
            near = [r for r in valid_rows if r["monthly"] <= min_cost * 1.05]
            winner = max(near, key=lambda r: r["utilization"])
        else:
            winner = min(rows, key=lambda r: r["monthly"])

        rows.sort(key=lambda r: (r["provider"] != winner["provider"], r["monthly"]))
        return jsonify({
            "forecast": f,
            "optimization": o,
            "required": {"cpu": need_cpu, "memory_gb": need_memory},
            "providers": rows,
            "recommended_provider": winner["provider"],
            "recommended_sku": winner["sku"],
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.get("/api/analytics")
def api_analytics():
    import pandas as pd
    try:
        df = pd.read_csv(ROOT / "outputs/timeseries.csv", parse_dates=["timestamp"])
        sample = df.tail(60)
        data = [{"timestamp": str(r.timestamp), "cpu": float(r.cpu_usage), "memory": float(r.memory_usage)} for r in sample.itertuples()]
        return jsonify({"series": data, "rows": len(df)})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    app.run(debug=True)
