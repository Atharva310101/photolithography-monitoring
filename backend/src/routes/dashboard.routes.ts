import { Router } from "express";
import {
    getLatestTelemetry,
    getTimelineTelemetry,
    getMachineHealth,
    getFabOverview,
    getActiveAlerts
} from "../services/dashboard.service";

const router = Router();

/**
 * 1. Latest telemetry for a machine
 * GET /dashboard/machines/:id/latest
 */
router.get("/machines/:id/latest", async (req, res) => {
    try {
        const machineId = Number(req.params.id);
        const data = await getLatestTelemetry(machineId);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch latest telemetry" });
    }
});

/**
 * 2. Timeline data for charts
 * GET /dashboard/machines/:id/timeline?minutes=60
 */
router.get("/machines/:id/timeline", async (req, res) => {
    try {
        const machineId = Number(req.params.id);
        const minutes = Number(req.query.minutes) || 60;
        const data = await getTimelineTelemetry(machineId, minutes);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch timeline data" });
    }
});

/**
 * 3. Machine health score + flags
 * GET /dashboard/machines/:id/health
 */
router.get("/machines/:id/health", async (req, res) => {
    try {
        const machineId = Number(req.params.id);
        const data = await getMachineHealth(machineId);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to compute machine health" });
    }
});

/**
 * 4. Fab-level overview stats
 * GET /dashboard/stats/overview
 */
router.get("/stats/overview", async (req, res) => {
    try {
        const data = await getFabOverview();
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch fab overview" });
    }
});

/**
 * 5. Active alerts
 * GET /dashboard/alerts
 */
router.get("/alerts", async (req, res) => {
    try {
        const data = await getActiveAlerts();
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch alerts" });
    }
});

export default router;