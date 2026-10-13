-- ============================================================================
-- ZeroCost AI: Multi-Cloud FinOps Orchestrator - Relational PostgreSQL Schema
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "timescaledb" CASCADE;

-- Enum Types
CREATE TYPE cloud_provider_type AS ENUM ('aws', 'azure', 'gcp');
CREATE TYPE resource_status_type AS ENUM ('running', 'idle', 'stopped', 'terminating', 'optimized');
CREATE TYPE environment_type AS ENUM ('production', 'staging', 'development');
CREATE TYPE recommendation_type AS ENUM ('RIGHTSIZE', 'STOP_IDLE', 'SCHEDULE_SHUTDOWN', 'SERVERLESS_MEMORY', 'STORAGE_TIER', 'RESERVED_SAVINGS');
CREATE TYPE risk_level_type AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE optimization_status_type AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXECUTING', 'EXECUTED', 'ROLLING_BACK', 'ROLLED_BACK');
CREATE TYPE anomaly_severity_type AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE user_role_type AS ENUM ('ADMIN', 'FINOPS_MANAGER', 'ENGINEER', 'VIEWER');

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role user_role_type DEFAULT 'ENGINEER',
    organization VARCHAR(150) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Cloud Accounts Table
CREATE TABLE IF NOT EXISTS cloud_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider cloud_provider_type NOT NULL,
    account_name VARCHAR(150) NOT NULL,
    account_identifier VARCHAR(100) NOT NULL, -- AWS Account ID / Azure Sub ID / GCP Project ID
    arn_or_principal VARCHAR(255) NOT NULL,
    environment environment_type DEFAULT 'production',
    status VARCHAR(50) DEFAULT 'connected',
    last_synced_at TIMESTAMP WITH TIME ZONE,
    resource_count INT DEFAULT 0,
    monthly_spend NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cloud_accounts_provider ON cloud_accounts (provider);
CREATE INDEX idx_cloud_accounts_env ON cloud_accounts (environment);

-- 3. Cloud Resources Table
CREATE TABLE IF NOT EXISTS cloud_resources (
    id VARCHAR(255) PRIMARY KEY, -- e.g. i-0a8b9c1d2e3f4001 or Azure resource URI
    account_id UUID REFERENCES cloud_accounts(id) ON DELETE CASCADE,
    provider cloud_provider_type NOT NULL,
    service VARCHAR(100) NOT NULL,
    service_category VARCHAR(50) NOT NULL, -- compute, serverless, database, storage
    resource_type VARCHAR(100) NOT NULL, -- c5.2xlarge, Standard_D4s_v5, n2-standard-4
    name VARCHAR(255) NOT NULL,
    region VARCHAR(100) NOT NULL,
    status resource_status_type DEFAULT 'running',
    environment environment_type DEFAULT 'production',
    cpu_cores NUMERIC(6, 2) DEFAULT 0,
    memory_gb NUMERIC(8, 2) DEFAULT 0,
    cost_hourly NUMERIC(10, 4) DEFAULT 0,
    cost_monthly NUMERIC(12, 2) DEFAULT 0,
    current_cpu_pct NUMERIC(5, 2) DEFAULT 0,
    current_mem_pct NUMERIC(5, 2) DEFAULT 0,
    current_requests_sec NUMERIC(10, 2) DEFAULT 0,
    potential_saving_monthly NUMERIC(12, 2) DEFAULT 0,
    has_anomaly BOOLEAN DEFAULT FALSE,
    has_recommendation BOOLEAN DEFAULT FALSE,
    tags JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_resources_provider ON cloud_resources (provider);
CREATE INDEX idx_resources_service ON cloud_resources (service);
CREATE INDEX idx_resources_status ON cloud_resources (status);
CREATE INDEX idx_resources_tags ON cloud_resources USING GIN (tags);

-- 4. Resource Telemetry Metrics (Timescale Hypertable Candidate)
CREATE TABLE IF NOT EXISTS resource_metrics (
    id BIGSERIAL,
    resource_id VARCHAR(255) REFERENCES cloud_resources(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    cpu_pct NUMERIC(5, 2) NOT NULL,
    mem_pct NUMERIC(5, 2) NOT NULL,
    network_in_mb NUMERIC(10, 2) DEFAULT 0,
    network_out_mb NUMERIC(10, 2) DEFAULT 0,
    request_count INT DEFAULT 0,
    latency_ms NUMERIC(8, 2) DEFAULT 0,
    hourly_cost NUMERIC(10, 4) NOT NULL,
    PRIMARY KEY (resource_id, timestamp)
);

CREATE INDEX idx_metrics_resource_time ON resource_metrics (resource_id, timestamp DESC);

-- 5. Normalized Cost Records
CREATE TABLE IF NOT EXISTS cost_records (
    id VARCHAR(255) PRIMARY KEY,
    provider cloud_provider_type NOT NULL,
    account_id VARCHAR(100) NOT NULL,
    service VARCHAR(100) NOT NULL,
    service_category VARCHAR(50) NOT NULL,
    resource_id VARCHAR(255) NOT NULL,
    resource_name VARCHAR(255) NOT NULL,
    region VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    usage_quantity NUMERIC(12, 4) NOT NULL,
    usage_unit VARCHAR(50) NOT NULL,
    cost NUMERIC(12, 4) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    environment environment_type DEFAULT 'production',
    tags JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_costs_provider_timestamp ON cost_records (provider, timestamp DESC);
CREATE INDEX idx_costs_service_timestamp ON cost_records (service, timestamp DESC);
CREATE INDEX idx_costs_env ON cost_records (environment);

-- 6. Optimization Recommendations
CREATE TABLE IF NOT EXISTS optimization_recommendations (
    id VARCHAR(255) PRIMARY KEY,
    resource_id VARCHAR(255) REFERENCES cloud_resources(id) ON DELETE CASCADE,
    resource_name VARCHAR(255) NOT NULL,
    provider cloud_provider_type NOT NULL,
    service VARCHAR(100) NOT NULL,
    service_category VARCHAR(50) NOT NULL,
    recommendation_type recommendation_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    action_description TEXT NOT NULL,
    current_cost_monthly NUMERIC(12, 2) NOT NULL,
    estimated_optimized_cost_monthly NUMERIC(12, 2) NOT NULL,
    estimated_monthly_savings NUMERIC(12, 2) NOT NULL,
    confidence_pct INT NOT NULL,
    risk_level risk_level_type DEFAULT 'LOW',
    status optimization_status_type DEFAULT 'PENDING',
    rollback_available BOOLEAN DEFAULT TRUE,
    expected_downtime_seconds INT DEFAULT 0,
    approved_by VARCHAR(150),
    approved_at TIMESTAMP WITH TIME ZONE,
    executed_at TIMESTAMP WITH TIME ZONE,
    rolled_back_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_optimizations_status ON optimization_recommendations (status);
CREATE INDEX idx_optimizations_savings ON optimization_recommendations (estimated_monthly_savings DESC);

-- 7. Anomalies Table
CREATE TABLE IF NOT EXISTS anomalies (
    id VARCHAR(255) PRIMARY KEY,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    provider cloud_provider_type NOT NULL,
    service VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255) REFERENCES cloud_resources(id) ON DELETE CASCADE,
    resource_name VARCHAR(255) NOT NULL,
    severity anomaly_severity_type NOT NULL,
    metric_type VARCHAR(100) NOT NULL,
    current_value NUMERIC(12, 2) NOT NULL,
    expected_value NUMERIC(12, 2) NOT NULL,
    deviation_pct NUMERIC(8, 2) NOT NULL,
    estimated_cost_impact_monthly NUMERIC(12, 2) NOT NULL,
    recommended_action TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE'
);

CREATE INDEX idx_anomalies_status ON anomalies (status);
CREATE INDEX idx_anomalies_severity ON anomalies (severity);

-- 8. Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    scope VARCHAR(50) NOT NULL, -- TOTAL, PROVIDER, SERVICE, ENVIRONMENT
    scope_value VARCHAR(100) NOT NULL,
    monthly_budget NUMERIC(12, 2) NOT NULL,
    actual_spend NUMERIC(12, 2) DEFAULT 0.00,
    forecasted_spend NUMERIC(12, 2) DEFAULT 0.00,
    alert_threshold_pct INT DEFAULT 80,
    status VARCHAR(50) DEFAULT 'HEALTHY',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(255) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    severity anomaly_severity_type NOT NULL,
    alert_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    resource_id VARCHAR(255),
    provider cloud_provider_type,
    is_read BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_alerts_read_time ON alerts (is_read, timestamp DESC);

-- 10. Immutable Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(255) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_name VARCHAR(150) NOT NULL,
    action VARCHAR(100) NOT NULL,
    provider cloud_provider_type NOT NULL,
    resource_id VARCHAR(255) NOT NULL,
    resource_name VARCHAR(255) NOT NULL,
    previous_state TEXT NOT NULL,
    new_state TEXT NOT NULL,
    estimated_saving_monthly NUMERIC(12, 2) DEFAULT 0,
    result VARCHAR(50) NOT NULL,
    details TEXT
);

CREATE INDEX idx_audit_time ON audit_logs (timestamp DESC);
