import { pool } from "../core/db";

export async function insertTelemetry(
    machineId: number,
    temperature: number,
    pressure: number,
    alignment_error: number,
    throughput: number,
    timestamp: string
) {
    const result = await pool.query(
        `INSERT INTO telemetry (machine_id, temperature, pressure, alignment_error, throughput, timestamp)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
        [machineId, temperature, pressure, alignment_error, throughput, timestamp]
    );

    return result.rows[0];
}

export async function getTelemetryForMachine(machineId: number) {
    const result = await pool.query(
        `SELECT * FROM telemetry
     WHERE machine_id = $1
     ORDER BY timestamp DESC
     LIMIT 100`,
        [machineId]
    );

    return result.rows;
}