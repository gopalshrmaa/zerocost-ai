# ZeroCost AI — Predictive Multi-Cloud Compute & Serverless FinOps Orchestrator

ZeroCost AI is an enterprise-grade FinOps orchestrator that continuously monitors multi-cloud compute and serverless workloads, forecasts future infrastructure expenditures using machine learning time-series models, detects cost and utilization anomalies, and executes controlled, reversible optimizations across **AWS**, **Microsoft Azure**, and **Google Cloud Platform (GCP)**.

---

## 1. Architecture Overview

ZeroCost AI decouples cloud provider-specific billing and metric APIs behind a normalized abstraction layer, passing telemetry through an analytical event stream into a statistical forecasting and anomaly detection engine, with bi-directional Server-Sent Events (SSE) streaming updates directly to the executive dashboard.

```mermaid
graph TD
    subgraph Cloud Providers
        AWS[AWS CloudWatch & Cost Explorer]
        AZURE[Azure Monitor & Cost Management]
        GCP[GCP Cloud Monitoring & Billing API]
    end

    subgraph ZeroCost Core Ingestion & Normalization
        P_ADAPTERS[Provider Adapters: AWS / Azure / GCP]
        NORM[Normalized Cost & Metric Engine]
        STORE[(PostgreSQL / Timescale Telemetry Store)]
    end

    subgraph Analytical & AI Engines
        ML_FORECAST[ML Time-Series Forecasting Engine]
        ANOMALY[Rolling Z-Score & IQR Anomaly Detector]
        OPT_ENGINE[FinOps Optimization & Rightsizing Engine]
        AI_SYNTHESIS[Gemini AI Architectural FinOps Synthesis]
    end

    subgraph Real-Time Event Pipeline
        EVENT_BUS[Server-Sent Events EventBus / WebSocket]
        AUDIT_LOG[Immutable Audit & Verification Ledger]
    end

    subgraph Presentation & Control Layer
        DASH[Executive FinOps Dashboard]
        EXPLORER[Topology & Resource Inspector]
        SIMULATOR[What-If Pricing Calculator]
        ORCHESTRATOR[Controlled Execution Workflow]
    end

    AWS --> P_ADAPTERS
    AZURE --> P_ADAPTERS
    GCP --> P_ADAPTERS

    P_ADAPTERS --> NORM
    NORM --> STORE
    STORE --> ML_FORECAST
    STORE --> ANOMALY
    STORE --> OPT_ENGINE
    OPT_ENGINE --> AI_SYNTHESIS

    ML_FORECAST --> EVENT_BUS
    ANOMALY --> EVENT_BUS
    OPT_ENGINE --> EVENT_BUS
    STORE --> AUDIT_LOG

    EVENT_BUS --> DASH
    STORE --> DASH
    STORE --> EXPLORER
    OPT_ENGINE --> ORCHESTRATOR
    STORE --> SIMULATOR
    ORCHESTRATOR --> AUDIT_LOG
```

---

## 2. Core Functional Modules

### A. Real-Time Telemetry & Normalization
* **Continuous Multi-Cloud Monitoring**: Standardizes AWS Cost Explorer, Azure Cost Management, and GCP Billing into `NormalizedCostRecord` formats.
* **Granular Telemetry**: Tracks CPU utilization, memory pressure, request volumes, invocation counts, hourly run rates, and idle waste signatures.
* **Live SSE Stream**: Automatically streams metric ticks and optimization findings without polling or arbitrary browser timers.

### B. Machine Learning Predictive Forecasting
* **Statistical Time-Series Modeling**: Weighted moving averages, 14-day trend regression, and weekend/weekday diurnal factor engineering.
* **Uncertainty Cones**: 95% confidence intervals (upper/lower bounds) derived from empirical residual variance ($R^2$ fit scores).
* **AI FinOps Synthesis**: Automated executive summaries detailing spend drivers and tactical reclamation steps powered by Gemini models.

### C. Anomaly & Waste Detection
* **Rolling Z-Score & IQR Analysis**: Detects compute spikes ($Z > 2.8$), unattached block storage volumes, serverless invocation loops ($>3.5\times$ historical mean), and chronic idle workloads ($<3\%$ CPU over 48 hours).
* **Financial Impact Modeling**: Calculates projected monthly dollar liability for every active anomaly.

### D. Controlled Optimization & Safety Workflows
* **Enforced Governance Protocol**: Recommendation $\rightarrow$ Risk Assessment $\rightarrow$ User Approval $\rightarrow$ Orchestration Execution $\rightarrow$ Verification $\rightarrow$ Immutable Audit Record.
* **Supported Actions**: Compute right-sizing, off-hours scheduled shutdown, serverless memory tuning, storage tier transition (Nearline/Archive), and unattached disk termination.
* **State Rollback**: Instant revert mechanism for executed configurations.

### E. What-If Cost Simulator
* **Configurable Workload Parameters**: Custom instance types across AWS (c5, m5, t3, r5), Azure (Standard_D, B, E), and GCP (n2, e2), region multipliers, runtime hours (1–730), storage types (gp3, standard_ssd, premium_ssd), and serverless invocations.
* **Procurement Models**: Models On-Demand, 1-Year Savings Plans (38% discount), 3-Year Reserved Instances (62% discount), and Spot/Preemptible instances (70% discount).

---

## 3. Technology Stack

* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Recharts, Lucide Icons.
* **Backend**: Node.js, Express, TypeScript (`tsx`), Server-Sent Events (SSE).
* **Database**: PostgreSQL 16 normalized relational schema with TimescaleDB hypertable compatibility, file-persisted runtime engine.
* **AI / ML**: `@google/genai` (Gemini 2.5 Flash), statistical time-series linear & exponential regression.
* **DevOps**: Docker, Docker Compose, Multi-stage builds.

---

## 4. REST API Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Observability healthcheck returning database, provider, and worker status |
| `GET` | `/metrics` | Prometheus-compatible application metrics |
| `GET` | `/api/events` | Server-Sent Events (SSE) live telemetry feed |
| `POST` | `/api/sync` | Trigger manual multi-cloud telemetry ingestion pass |
| `GET` | `/api/dashboard` | Executive KPI aggregates, top expensive resources, active anomalies |
| `GET` | `/api/costs` | Filtered normalized cost records (`provider`, `service`, `timeframe`) |
| `GET` | `/api/costs/forecast` | ML 30-day predictive forecast with uncertainty bounds |
| `GET` | `/api/resources` | Cloud workload inventory with filtering and search |
| `GET` | `/api/resources/:id` | Workload telemetry drawer data (72h CPU/Mem/Net, recommendations) |
| `GET` | `/api/optimizations` | All active, approved, and executed recommendations |
| `POST` | `/api/optimizations/:id/approve` | Approve a recommendation for execution |
| `POST` | `/api/optimizations/:id/reject` | Dismiss/reject a recommendation with reason |
| `POST` | `/api/optimizations/:id/execute` | Execute optimization against provider API |
| `POST` | `/api/optimizations/:id/rollback` | Revert executed optimization to baseline |
| `GET` | `/api/anomalies` | Detected cost spikes and idle compute anomalies |
| `GET` | `/api/cloud-accounts` | Connected AWS, Azure, and GCP accounts |
| `POST` | `/api/cloud-accounts/test` | Authenticate IAM credentials and verify permissions |
| `POST` | `/api/cloud-accounts` | Onboard and save new cloud account |
| `GET` | `/api/budgets` | Budget governance thresholds and utilization |
| `POST` | `/api/simulator/calculate` | What-If pricing calculator calculation |
| `GET` | `/api/audit-logs` | Immutable audit trail records |

---

## 5. Local Setup & Running

### Requirements
- Node.js $\ge 20$
- npm $\ge 10$

### Development
```bash
# Install dependencies
npm install

# Start full-stack application (Express + Vite Dev Server on port 3000)
npm run dev
```

Open your browser at `http://localhost:3000`.

### Docker Deployment
```bash
# Launch PostgreSQL, Redis, and full-stack ZeroCost container
docker-compose up --build -d
```

---

## 6. Environment Variables (`.env`)

```env
# Google GenAI API Key for AI FinOps Synthesis (optional, fallback active)
GEMINI_API_KEY="your-api-key"

# Application URL
APP_URL="http://localhost:3000"

# Production PostgreSQL URL (used in Docker / Cloud Run)
DATABASE_URL="postgres://finops_admin:password@localhost:5432/zerocost_finops"
```

---

## 7. Security & Compliance
- **Zero-Trust IAM**: Cloud credentials (Role ARNs, Service Principals, Service Accounts) are managed strictly server-side.
- **Audit Immutability**: All approvals, rejections, automated runs, and rollbacks are recorded in append-only audit tables.
- **Safety Protocol**: Destructive or right-sizing operations require explicit risk confirmation before execution.
