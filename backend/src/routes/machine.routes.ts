import { Router } from "express";
import { getAllMachines, createMachine } from "../services/machines.service";

const router = Router();

router.get("/", async (_req, res) => {
    try {
        const machines = await getAllMachines();
        res.json(machines);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch machines" });
    }
});

router.post("/", async (req, res) => {
    try {
        const { name, status } = req.body;
        const machine = await createMachine(name, status);
        res.json(machine);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create machine" });
    }
});

export default router;