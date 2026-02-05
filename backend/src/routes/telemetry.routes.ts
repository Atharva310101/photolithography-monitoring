import { Router } from "express";
import { insertTelemetry, getTelemetryForMachine } from "../services/telemetry.service";

const router = Router();

router.post("/", async (req, res) => {
    try {
        const {
            machineId,
            temperature,
            pressure,
            alignment_error,
            throughput,
            timestamp
        } = req.body;

        // Validate required fields
        if (
            machineId === undefined ||
            temperature === undefined ||
            pressure === undefined ||
            alignment_error === undefined ||
            throughput === undefined ||
            timestamp === undefined
        ) {
            return res.status(400).json({ error: "Missing required telemetry fields" });
        }

        const record = await insertTelemetry(
            machineId,
            temperature,
            pressure,
            alignment_error,
            throughput,
            timestamp
        );

        res.json(record);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to insert telemetry" });
    }
});

router.get("/:machineId", async (req, res) => {
    try {
        const machineId = Number(req.params.machineId);

        if (isNaN(machineId)) {
            return res.status(400).json({ error: "Invalid machineId" });
        }

        const data = await getTelemetryForMachine(machineId);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch telemetry" });
    }
});

export default router;