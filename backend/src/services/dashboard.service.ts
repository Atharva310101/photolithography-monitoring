import { pool } from "../core/db";

// ---------------------------------------------
// Global trend history (per machine)
// ---------------------------------------------
declare global {
    // eslint-disable-next-line no-var
    var healthHistory: Record<number, { timestamp: string; health: number }[]>;
}

if (!global.healthHistory) {
    global.healthHistory = {};
}

/* -------------------------------------------------------
   1. Latest telemetry for a machine
------------------------------------------------------- */
export async function getLatestTelemetry(machineId: number) {
    const query = `
        SELECT
            t.id,
            t.machine_id,
            t.timestamp,
            t.temperature::float AS temperature,
            t.pressure::float AS pressure,
            t.alignment_error::float AS alignment_error,
            t.throughput::float AS throughput,
            m.status
        FROM telemetry t
        JOIN machines m ON m.id = t.machine_id
        WHERE t.machine_id = $1
        ORDER BY t.timestamp DESC
        LIMIT 1;
    `;

    const result = await pool.query(query, [machineId]);
    return result.rows[0] || null;
}

/* -------------------------------------------------------
   2. Timeline telemetry (for charts)
------------------------------------------------------- */
export async function getTimelineTelemetry(machineId: number, minutes: number) {
    const query = `
        SELECT
            id,
            machine_id,
            timestamp,
            temperature::float AS temperature,
            pressure::float AS pressure,
            alignment_error::float AS alignment_error,
            throughput::float AS throughput
        FROM telemetry
        WHERE machine_id = $1
          AND timestamp > (NOW() AT TIME ZONE 'UTC') - INTERVAL '${minutes} minutes'
        ORDER BY timestamp ASC;
    `;

    const result = await pool.query(query, [machineId]);
    return result.rows;
}

/* -------------------------------------------------------
   3. Machine health score (hybrid severity + counters + trend)
------------------------------------------------------- */
export async function getMachineHealth(machineId: number) {
    const latest = await getLatestTelemetry(machineId);
    if (!latest) return { health: 0, flags: ["no_data"], latest: null };

    const window = await getTimelineTelemetry(machineId, 30);
    if (window.length < 5) {
        return { health: 50, flags: ["insufficient_data"], latest };
    }

    // Extract arrays
    const temps = window.map(r => r.temperature);
    const pressures = window.map(r => r.pressure);
    const aligns = window.map(r => r.alignment_error);
    const throughputs = window.map(r => r.throughput);

    // Helpers
    const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const std = (arr: number[]) => {
        const m = mean(arr);
        return Math.sqrt(mean(arr.map(x => (x - m) ** 2)));
    };

    // Stats
    const tempMean = mean(temps);
    const tempStd = std(temps);
    const tempZ = (latest.temperature - tempMean) / (tempStd || 1);

    const alignMean = mean(aligns);
    const alignStd = std(aligns);
    const alignZ = (latest.alignment_error - alignMean) / (alignStd || 1);

    const thrMean = mean(throughputs);
    const thrStd = std(throughputs);
    const thrZ = (latest.throughput - thrMean) / (thrStd || 1);

    // Drift
    const drift = aligns[aligns.length - 1] - aligns[0];

    // Worst-case values
    const maxTemp = Math.max(...temps);
    const minThroughput = Math.min(...throughputs);
    const minPressure = Math.min(...pressures);

    // ---------------------------------------------
    // Anomaly counters
    // ---------------------------------------------
    const tempSpikeCount = temps.filter(t => t > 80).length;
    const throughputDropCount = throughputs.filter(th => th < 80).length;
    const pressureLowCount = pressures.filter(p => p < 0.97).length;
    const driftCount = aligns.filter(a => a > 0.02).length;
    const zscoreAnomalyCount = [
        Math.abs(tempZ) > 2.5,
        thrZ < -1.5,
        alignZ > 2
    ].filter(Boolean).length;

    // ---------------------------------------------
    // Health score
    // ---------------------------------------------
    let health = 100;
    const flags: string[] = [];

    // Raw thresholds
    if (maxTemp > 80) {
        health -= 30;
        flags.push("temperature_spike");
    }

    if (minThroughput < 80) {
        health -= 30;
        flags.push("throughput_drop");
    }

    if (minPressure < 0.97) {
        health -= 10;
        flags.push("pressure_low");
    }

    if (drift > 0.01) {
        health -= 40;
        flags.push("alignment_drift");
    }

    // Z-score anomalies
    if (Math.abs(tempZ) > 2.5) {
        health -= 10;
        flags.push("temp_zscore_anomaly");
    }

    if (thrZ < -1.5) {
        health -= 10;
        flags.push("throughput_zscore_anomaly");
    }

    if (alignZ > 2) {
        health -= 10;
        flags.push("alignment_zscore_anomaly");
    }

    health = Math.max(0, Math.min(100, health));

    // ---------------------------------------------
    // Hybrid severity
    // ---------------------------------------------
    type Severity = "HEALTHY" | "MINOR" | "MAJOR" | "CRITICAL";
    let anomalySeverity: Severity = "HEALTHY";
    let healthSeverity: Severity = "HEALTHY";

    if (flags.includes("throughput_drop") || flags.includes("temperature_spike") || flags.includes("pressure_low")) {
        anomalySeverity = "CRITICAL";
    } else if (flags.includes("alignment_drift") || zscoreAnomalyCount >= 2) {
        anomalySeverity = "MAJOR";
    } else if (flags.length > 0) {
        anomalySeverity = "MINOR";
    }

    if (health < 40) healthSeverity = "CRITICAL";
    else if (health < 70) healthSeverity = "MAJOR";
    else if (health < 90) healthSeverity = "MINOR";

    const severityRank: Record<Severity, number> = {
        HEALTHY: 0,
        MINOR: 1,
        MAJOR: 2,
        CRITICAL: 3
    };

    const severity =
        severityRank[anomalySeverity] >= severityRank[healthSeverity]
            ? anomalySeverity
            : healthSeverity;

    // ---------------------------------------------
    // Trend tracking
    // ---------------------------------------------
    if (!global.healthHistory[machineId]) global.healthHistory[machineId] = [];

    global.healthHistory[machineId].push({
        timestamp: latest.timestamp,
        health
    });

    global.healthHistory[machineId] =
        global.healthHistory[machineId].slice(-600);

    // ---------------------------------------------
    // Return
    // ---------------------------------------------
    return {
        health,
        severity,
        flags,
        anomaly_counts: {
            temp_spike: tempSpikeCount,
            throughput_drop: throughputDropCount,
            pressure_low: pressureLowCount,
            drift: driftCount,
            zscore: zscoreAnomalyCount
        },
        trend: global.healthHistory[machineId],
        latest,
        stats: {
            tempMean, tempStd, tempZ,
            alignMean, alignStd, alignZ,
            thrMean, thrStd, thrZ,
            drift,
            maxTemp,
            minThroughput,
            minPressure
        }
    };
}

/* -------------------------------------------------------
   4. Fab-level overview
------------------------------------------------------- */
export async function getFabOverview() {
    const query = `
        SELECT
            COUNT(*) AS total_rows,
            AVG(temperature) AS avg_temp,
            AVG(pressure) AS avg_pressure,
            AVG(throughput) AS avg_throughput
        FROM telemetry
        WHERE timestamp > NOW() - INTERVAL '10 minutes';
    `;

    const result = await pool.query(query);
    const row = result.rows[0];

    return {
        avg_temperature: Number(row.avg_temp || 0),
        avg_pressure: Number(row.avg_pressure || 0),
        avg_throughput: Number(row.avg_throughput || 0),
        rows_analyzed: Number(row.total_rows || 0)
    };
}

/* -------------------------------------------------------
   5. Active alerts
------------------------------------------------------- */
export async function getActiveAlerts() {
    const query = `
        SELECT *
        FROM telemetry
        WHERE temperature > 80
           OR alignment_error > 0.02
           OR throughput < 80
           OR pressure < 0.97
        ORDER BY timestamp DESC
        LIMIT 50;
    `;

    const result = await pool.query(query);
    return result.rows;
}