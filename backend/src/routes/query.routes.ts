import { Router } from "express";
import { pool } from "../core/db";
import { generateSQL, summarizeResult } from "../services/genai.service";

const router = Router();

router.post("/query", async (req, res) => {
    try {
        const { question } = req.body;

        const sql = await generateSQL(question);
        console.log("Generated SQL:", sql);
        const dbResult = await pool.query(sql);

        const summary = await summarizeResult(question, dbResult.rows);

        res.json({
            sql,
            rows: dbResult.rows,
            summary
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Query failed" });
    }
});

export default router;