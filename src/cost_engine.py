
import os
import sys

ROOT = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

sys.path.append(ROOT)

from config import (
    CPU_PRICE_PER_UNIT_HOUR,
    MEMORY_PRICE_PER_UNIT_GB_HOUR,
    TARGET_CPU_UTILIZATION,
    TARGET_MEMORY_UTILIZATION,
    HOURS_PER_MONTH,
)


def calculate_cost(cpu_capacity, memory_capacity):
    hourly = (
        cpu_capacity * CPU_PRICE_PER_UNIT_HOUR
        + memory_capacity * MEMORY_PRICE_PER_UNIT_GB_HOUR
    )

    return {
        "hourly": hourly,
        "monthly": hourly * HOURS_PER_MONTH
    }


def optimize(
    predicted_cpu,
    predicted_memory,
    current_cpu,
    current_memory
):

    predicted_cpu = max(float(predicted_cpu), 0.001)
    predicted_memory = max(float(predicted_memory), 0.001)

    current_cpu = max(float(current_cpu), 0.001)
    current_memory = max(float(current_memory), 0.001)

    # --------------------------------------------------
    # REQUIRED CAPACITY
    # --------------------------------------------------

    recommended_cpu = max(
        predicted_cpu / TARGET_CPU_UTILIZATION,
        0.001
    )

    recommended_memory = max(
        predicted_memory / TARGET_MEMORY_UTILIZATION,
        0.001
    )

    # --------------------------------------------------
    # CURRENT CAPACITY
    # --------------------------------------------------

    current_capacity_cpu = max(
        current_cpu / TARGET_CPU_UTILIZATION,
        0.001
    )

    current_capacity_memory = max(
        current_memory / TARGET_MEMORY_UTILIZATION,
        0.001
    )

    # --------------------------------------------------
    # COST
    # --------------------------------------------------

    current = calculate_cost(
        current_capacity_cpu,
        current_capacity_memory
    )

    optimized = calculate_cost(
        recommended_cpu,
        recommended_memory
    )

    saving = (
        current["monthly"]
        - optimized["monthly"]
    )

    saving_pct = (
        saving / current["monthly"] * 100
        if current["monthly"] > 0
        else 0
    )

    # --------------------------------------------------
    # RESOURCE RATIOS
    # --------------------------------------------------

    cpu_ratio = (
        predicted_cpu / current_cpu
        if current_cpu > 0
        else 1.0
    )

    memory_ratio = (
        predicted_memory / current_memory
        if current_memory > 0
        else 1.0
    )

    # --------------------------------------------------
    # WEIGHTED RESOURCE DEMAND
    #
    # CPU    = 70%
    # MEMORY = 30%
    #
    # This prevents a small memory increase from
    # overriding a large CPU decrease.
    # --------------------------------------------------

    cpu_weight = 0.70
    memory_weight = 0.30

    demand_ratio = (
        cpu_ratio * cpu_weight
        + memory_ratio * memory_weight
    )

    # --------------------------------------------------
    # DECISION
    # --------------------------------------------------

    if demand_ratio > 1.10:

        action = "SCALE-UP"

        reason = (
            "Forecast resource demand is more than "
            "10% above the current workload."
        )

    elif demand_ratio < 0.90:

        action = "DOWN-SCALE"

        reason = (
            "Forecast resource demand is more than "
            "10% below the current workload."
        )

    else:

        action = "KEEP"

        reason = (
            "Forecast resource demand is within "
            "10% of the current workload."
        )

    return {
        "recommended_cpu": recommended_cpu,
        "recommended_memory": recommended_memory,

        "current_capacity_cpu": current_capacity_cpu,
        "current_capacity_memory": current_capacity_memory,

        "current_monthly_cost": current["monthly"],
        "optimized_monthly_cost": optimized["monthly"],

        "estimated_monthly_saving": saving,
        "saving_percent": saving_pct,

        "cpu_ratio": cpu_ratio,
        "memory_ratio": memory_ratio,
        "demand_ratio": demand_ratio,

        "action": action,
        "reason": reason,
    }
