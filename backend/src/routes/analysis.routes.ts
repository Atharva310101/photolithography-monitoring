import { Router } from "express";
import axios from "axios";
import { generateInsight } from "../services/genai.service";

const router = Router();

router.post("/analyze", async (req, res) => {
    try {
        const { question, machineId, minutes, history } = req.body;

        const [health, timeline, alerts, overview] = await Promise.all([
            axios.get(`http://localhost:4000/dashboard/machines/${machineId}/health`).then(r => r.data),
            axios.get(`http://localhost:4000/dashboard/machines/${machineId}/timeline?minutes=${minutes || 60}`).then(r => r.data),
            axios.get(`http://localhost:4000/dashboard/alerts`).then(r => r.data),
            axios.get(`http://localhost:4000/dashboard/stats/overview`).then(r => r.data),
        ]);

        const context = { health, timeline, alerts, overview };

        const answer = await generateInsight(question, context, history);

        res.json({ answer });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Analysis failed" });
    }
});

export default router;