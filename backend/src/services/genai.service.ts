import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not defined in the environment variables.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

type ChatTurn = { role: "user" | "assistant"; content: string };

export async function generateInsight(
    question: string,
    context: any,
    history: ChatTurn[] = []
) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const conversation = history.length
        ? history.map(h => `${h.role.toUpperCase()}: ${h.content}`).join("\n")
        : "None";

    const prompt = `
You are an expert semiconductor equipment analyst.
Use the conversation history to maintain context and answer follow-up questions.

CONVERSATION HISTORY:
${conversation}

NEW QUESTION:
${question}

CONTEXT:
${JSON.stringify(context, null, 2)}

Return a clear, concise explanation suitable for fab engineers.
`;

    const result = await model.generateContent(prompt);
    return result.response.text();
}

export async function generateSQL(question: string) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are an expert SQL generator for a photolithography monitoring database.

Tables:
machines(id, name, status)
telemetry(id, machine_id, temperature, pressure, alignment_error, throughput, timestamp)

Convert the following natural-language question into a valid PostgreSQL query.
Return ONLY the SQL. No markdown. No code fences. No backticks.

QUESTION:
${question}
`;

    const result = await model.generateContent(prompt);
    let sql = result.response.text().trim();

    sql = sql.replace(/```sql/gi, "")
        .replace(/```/g, "")
        .trim();

    return sql;
}

export async function summarizeResult(question: string, rows: any[]) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
Summarize the following SQL result in plain English.

QUESTION:
${question}

RESULT:
${JSON.stringify(rows, null, 2)}
`;

    const result = await model.generateContent(prompt);
    return result.response.text();
}