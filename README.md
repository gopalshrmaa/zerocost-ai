# ZeroCost AI

ZeroCost AI is a real ML-based resource forecasting and optimization system built from the uploaded Google Borg/Cluster workload trace.

## What makes it real?

The system does not use fake predictions or random dashboard numbers.

Pipeline:

Google Borg workload CSV
-> parse real CPU/memory dictionaries
-> 5-minute workload aggregation
-> lag/rolling feature engineering
-> chronological train/test split
-> Random Forest forecasting
-> CPU/Memory demand forecast
-> capacity sizing
-> configurable reference cost calculation
-> optimization recommendation
-> Flask dashboard

## Dataset

Place the dataset at:

`data/borg_traces_data.csv`

The supplied dataset has 405,894 rows and 34 columns.

Important fields used:

- `start_time`
- `average_usage`
- `maximum_usage`
- `resource_request`
- `assigned_memory`
- `failed`

`average_usage`, `maximum_usage`, and `resource_request` contain dictionaries such as:

`{'cpus': 0.0046, 'memory': 0.0059}`

The preprocessing code parses these values instead of treating them as arbitrary strings.

## Setup

Create and activate a virtual environment.

Windows:

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Train the model

```powershell
python src/train.py
```

This creates:

- `outputs/timeseries.csv`
- `outputs/model_metrics.csv`
- `outputs/cpu_usage_predictions.csv`
- `outputs/memory_usage_predictions.csv`
- `models/cpu_usage_model.pkl`
- `models/memory_usage_model.pkl`

## Run dashboard

```powershell
python app.py
```

Open:

`http://127.0.0.1:5000`

## Optimization logic

The optimizer compares current resource capacity with forecast demand.

Capacity is sized using:

`required_cpu = predicted_cpu / target_cpu_utilization`

`required_memory = predicted_memory / target_memory_utilization`

Default targets are 70% CPU and 75% memory. They can be changed in `config.py`.

## Cost model

Cloud credentials are NOT required.

Cost is calculated from configurable reference rates in `config.py`.

This is deliberately not presented as a live AWS/Azure/GCP bill. For production use, replace the rates with the provider and instance pricing you want to model.

## Model evaluation

The training script reports:

- MAE
- RMSE
- R2

The split is chronological so future records are not used to train the past.

## Important limitation

The Borg trace contains normalized resource units rather than a live cloud billing account. Therefore the project can produce a genuine workload forecast and mathematically consistent cost/optimization estimate, but it cannot claim a real cloud invoice without provider pricing and deployment information.

## Project structure

```text
ZeroCost-AI/
├── app.py
├── config.py
├── requirements.txt
├── data/
├── models/
├── outputs/
├── src/
│   ├── preprocess.py
│   ├── train.py
│   ├── forecast.py
│   └── cost_engine.py
├── templates/
└── static/
```
