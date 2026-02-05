import express from "express";
import cors from "cors";
import morgan from "morgan";
import { pool } from "./core/db";
import machineRoutes from "./routes/machine.routes";
import telemetryRoutes from "./routes/telemetry.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

app.get("/db-test", async (_req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({ dbTime: result.rows[0].now });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database connection failed" });
    }
});

app.use("/machines", machineRoutes);
app.use("/telemetry", telemetryRoutes);

export default app;
