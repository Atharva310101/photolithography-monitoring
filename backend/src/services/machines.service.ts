import { pool } from "../core/db";

export async function getAllMachines() {
    const result = await pool.query("SELECT * FROM machines ORDER BY id");
    return result.rows;
}

export async function createMachine(name: string, status: string) {
    const result = await pool.query(
        "INSERT INTO machines (name, status) VALUES ($1, $2) RETURNING *",
        [name, status]
    );
    return result.rows[0];
}