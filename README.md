# 🚀 ZeroCost AI
## Predictive Multi-Cloud Compute & Serverless FinOps Orchestrator

ZeroCost AI is an ML-powered FinOps platform that predicts future cloud resource demand and recommends cost-efficient compute configurations.

The system combines **Machine Learning forecasting, resource right-sizing, cloud cost estimation, and optimization** to help reduce unnecessary infrastructure costs.

---

## 🎯 Problem Statement

Cloud infrastructure can become expensive when resources are over-provisioned or workloads change over time.

Traditional cloud resource management often reacts to current usage instead of anticipating future demand.

ZeroCost AI addresses this problem by:

- Predicting future CPU and memory requirements
- Estimating current infrastructure cost
- Recommending optimized resource capacity
- Comparing compute and serverless architectures
- Comparing AWS, Azure, and GCP using configurable reference pricing
- Providing actionable FinOps recommendations

---

## 💡 Solution

ZeroCost AI follows this pipeline:

```text
User Workload Input
        ↓
Historical Workload Dataset
        ↓
Data Processing & Feature Engineering
        ↓
Random Forest ML Models
        ↓
CPU & Memory Forecast
        ↓
Cost Estimation
        ↓
Resource Right-Sizing
        ↓
Compute vs Serverless Comparison
        ↓
AWS vs Azure vs GCP Comparison
        ↓
FinOps Recommendation
        ↓
Interactive Dashboard
```

---

## ✨ Key Features

### 🤖 Machine Learning Forecasting

The system uses **Random Forest Regression** models to forecast:

- CPU usage
- Memory usage

The models are trained using historical workload data derived from the **Google Borg workload dataset**.

---

### 📊 Workload Analysis

Users can provide:

- CPU Usage
- Memory Usage
- Active Workloads
- Assigned Memory

The system combines these inputs with historical workload patterns to generate the next workload forecast.

---

### 💰 Cost Optimization

ZeroCost AI estimates:

- Current monthly infrastructure cost
- Optimized monthly cost
- Estimated monthly savings
- Saving percentage
- Recommended CPU capacity
- Recommended memory capacity

The optimizer uses predicted workload demand to identify possible over-provisioning.

---

### ☁️ Multi-Cloud Comparison

The platform supports reference cost comparison between:

- AWS
- Microsoft Azure
- Google Cloud Platform

The system identifies the comparatively cheaper cloud option for the analyzed workload.

> Cloud prices in this project are configurable reference assumptions and are not live cloud billing data.

---

### ⚡ Compute vs Serverless

The system can compare:

**Traditional Compute**

vs.

**Serverless**

Serverless estimation considers:

- Number of invocations
- Function duration
- Function memory

The system can recommend switching to serverless when the estimated workload economics make it more cost-efficient.

---

### 📈 Interactive Dashboard

The Flask dashboard provides:

- Workload input
- ML prediction
- Cost optimization
- Cloud comparison
- Recommendation
- Historical prediction records
- Forecast information

---

## 🧠 Machine Learning

### Model

The project uses:

```text
RandomForestRegressor
```

Two independent models are used:

```text
CPU Usage Model
        ↓
Predicted CPU Usage

Memory Usage Model
        ↓
Predicted Memory Usage
```

### Features

The trained models use workload and time-series features such as:

- Peak CPU
- Peak Memory
- Requested CPU
- Requested Memory
- Assigned Memory
- Workload Count
- Failed Count
- Hour
- Minute
- Day of Week
- CPU usage lags
- Memory usage lags
- Rolling averages
- Peak CPU lags
- Peak Memory lags
- Requested resource lags
- Workload count lags

---

## 📂 Dataset

The project uses workload traces based on the **Google Borg workload dataset**.

The raw dataset contains historical workload information including resource usage, resource requests, assigned resources, machines, events, and failures.

The preprocessing pipeline converts the raw workload traces into time-series workload windows.

The resulting processed dataset is used for model training and forecasting.

---

## 🏗️ Project Architecture

```text
                    ┌──────────────────────┐
                    │   User Workload      │
                    │       Input          │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  Historical Workload │
                    │       Dataset        │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Feature Engineering  │
                    │  Lag + Rolling Data  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Random Forest Models │
                    │ CPU + Memory         │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Demand Forecasting   │
                    └──────────┬───────────┘
                               │
                 ┌─────────────┴─────────────┐
                 ▼                           ▼
        ┌─────────────────┐        ┌─────────────────┐
        │ Compute Cost    │        │ Serverless Cost │
        │ Estimation      │        │ Estimation      │
        └────────┬────────┘        └────────┬────────┘
                 │                          │
                 └────────────┬─────────────┘
                              ▼
                   ┌────────────────────┐
                   │ FinOps Optimizer   │
                   └─────────┬──────────┘
                             │
                             ▼
                   ┌────────────────────┐
                   │ Recommendation     │
                   │ Cloud + Resources  │
                   └─────────┬──────────┘
                             │
                             ▼
                   ┌────────────────────┐
                   │ Flask Dashboard    │
                   └────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend

- Python
- Flask

### Machine Learning

- Scikit-learn
- Random Forest
- Pandas
- NumPy
- Joblib

### Data Processing

- Pandas
- NumPy
- Google Borg workload traces

### Frontend

- HTML
- CSS
- JavaScript

### Database

- SQLite

### Deployment

The application can be deployed on Python-compatible hosting platforms.

---

## 📁 Project Structure

```text
ZeroCost-AI/
│
├── app.py
├── config.py
├── requirements.txt
├── README.md
│
├── data/
│   └── borg_traces_data.csv
│
├── models/
│   ├── cpu_usage_model.pkl
│   └── memory_usage_model.pkl
│
├── outputs/
│   ├── timeseries.csv
│   ├── model_metrics.csv
│   ├── cpu_usage_predictions.csv
│   ├── memory_usage_predictions.csv
│   └── training_log.txt
│
├── src/
│   ├── preprocess.py
│   ├── train.py
│   ├── forecast.py
│   └── cost_engine.py
│
├── templates/
│   ├── index.html
│   ├── history.html
│   ├── forecast.html
│   ├── optimization.html
│   └── about.html
│
├── static/
│   ├── style.css
│   └── script.js
│
└── instance/
    └── zerocost.db
```

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd ZeroCost-AI
```

### 2. Create virtual environment

Windows:

```powershell
python -m venv .venv
```

Activate it:

```powershell
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

---

### 3. Install dependencies

```powershell
python -m pip install -r requirements.txt
```

---

### 4. Run the application

```powershell
python app.py
```

Open:

```text
http://127.0.0.1:5000
```

---

## 🖥️ Using the Dashboard

Example input:

```text
CPU Usage        : 1.45
Memory Usage     : 0.045
Active Workloads : 120
Assigned Memory  : 0.0605
```

Click:

```text
PREDICT & OPTIMIZE
```

The system then performs:

```text
Input
 ↓
Feature Generation
 ↓
ML Forecast
 ↓
Cost Calculation
 ↓
Resource Optimization
 ↓
FinOps Recommendation
```

---

## 📊 Example Output

The dashboard can provide results such as:

```text
Predicted CPU       → Future CPU demand
Predicted Memory    → Future memory demand

Current Cost        → Estimated current monthly cost
Optimized Cost      → Estimated optimized monthly cost

Monthly Saving      → Estimated savings
Saving %            → Estimated percentage saving

Recommendation      → RIGHT-SIZE / KEEP / MOVE TO SERVERLESS
```

The exact result depends on the workload input and trained model.

---

## 🔄 FinOps Decision Logic

The optimizer compares current resource capacity with forecasted demand.

Conceptually:

```text
Current Capacity
       ↓
Forecast Future Demand
       ↓
Is current capacity excessive?
       │
       ├── Yes → Right-size resources
       │
       └── No
            ↓
      Compare architectures
            ↓
     Compute vs Serverless
            ↓
      Compare cloud options
            ↓
       Recommendation
```

---

## 💵 Cost Model

Compute cost is estimated using configurable reference pricing for CPU and memory.

Serverless cost is estimated using:

```text
GB-seconds
+
Request Cost
```

The cloud comparison applies configurable reference multipliers for AWS, Azure, and GCP.

These values are intended for **optimization analysis and project demonstration**, not as live provider billing.

---

## 📌 Important Limitations

### 1. Reference Cloud Pricing

The project does not currently connect to live AWS, Azure, or GCP billing APIs.

Therefore:

```text
Cloud Cost = Reference / Configurable Estimate
```

and should not be presented as actual billing.

---

### 2. Forecasting Accuracy

Forecast quality depends on:

- Dataset quality
- Historical workload patterns
- Feature distribution
- Model performance
- Similarity between user input and historical workload

---

### 3. Serverless Pricing

Serverless calculations use configurable reference assumptions rather than retrieving live provider pricing.

---

### 4. Cloud Credentials

AWS, Azure, and GCP credentials are not required for the core ML forecasting and cost optimization workflow.

This allows the project to run locally without connecting to cloud accounts.

---

## 🔮 Future Improvements

Possible future versions can include:

- Live AWS Cost Explorer integration
- Azure Cost Management integration
- Google Cloud Billing API integration
- Real-time cloud monitoring
- Kubernetes workload optimization
- Auto-scaling recommendations
- LSTM/GRU forecasting
- XGBoost/LightGBM comparison
- Advanced anomaly detection
- Carbon-aware cloud optimization
- Real-time pricing APIs
- Automated cloud resource provisioning
- Kubernetes HPA/VPA recommendations
- Cloud billing dashboard

---

## 🎓 Project Applications

ZeroCost AI can be used for:

- Cloud FinOps
- Infrastructure optimization
- Cloud cost reduction
- Resource right-sizing
- Capacity planning
- Workload forecasting
- Serverless decision making
- Multi-cloud analysis

---

## 🏆 Project Highlights

```text
✓ Machine Learning Forecasting
✓ Time-Series Feature Engineering
✓ Resource Right-Sizing
✓ Cloud Cost Estimation
✓ Multi-Cloud Comparison
✓ Serverless Cost Analysis
✓ FinOps Recommendation Engine
✓ Interactive Flask Dashboard
✓ Historical Prediction Tracking
✓ SQLite Persistence
```

---

## 👨‍💻 Author

**Sorab Bhadautiya**

B.Tech CSE — Artificial Intelligence & Machine Learning

---

## ⭐ Conclusion

ZeroCost AI combines **Machine Learning + Cloud Computing + FinOps + Optimization** into a single platform.

Instead of simply monitoring current infrastructure usage, the system attempts to **predict future resource demand and use that prediction to recommend a more cost-efficient infrastructure configuration**.

The goal is simple:

> **Predict demand. Optimize resources. Reduce unnecessary cloud cost.**
