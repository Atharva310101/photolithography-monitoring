import { pool } from "../core/db";

export async function cleanupTelemetry(maxRowsPerMachine = 50000) {
    try {
        // Get all machine IDs
        const machines = await pool.query(`SELECT id FROM machines`);
        const machineIds = machines.rows.map(r => r.id);

        for (const machineId of machineIds) {
            await pool.query(
                `
                DELETE FROM telemetry
                WHERE id NOT IN (
                    SELECT id FROM telemetry
                    WHERE machine_id = $1
                    ORDER BY timestamp DESC
                    LIMIT $2
                )
                AND machine_id = $1;
                `,
                [machineId, maxRowsPerMachine]
            );
        }

        console.log("Telemetry cleanup complete.");
    } catch (err) {
        console.error("Telemetry cleanup failed:", err);
    }
}