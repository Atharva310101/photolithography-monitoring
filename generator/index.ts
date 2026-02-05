// generator/index.ts

import axios from "axios";
import { machineProfiles, TelemetrySample } from "./machineProfiles";

const BACKEND_URL = "http://localhost:4000/telemetry";
const INTERVAL_MS = 3000; // send every 3 seconds

let startTime = Date.now();

function buildPayload(sample: TelemetrySample) {
    return {
        machineId: sample.machineId,
        temperature: sample.temperature,
        pressure: sample.pressure,
        alignment_error: sample.alignment_error,
        throughput: sample.throughput,
        timestamp: new Date().toISOString(),
    };
}

async function sendSample(sample: TelemetrySample) {
    const payload = buildPayload(sample);
    try {
        const res = await axios.post(BACKEND_URL, payload);
        console.log(
            `[OK] M${sample.machineId} T=${payload.temperature.toFixed(
                2
            )} P=${payload.pressure.toFixed(3)} A=${payload.alignment_error.toFixed(
                3
            )} Th=${payload.throughput.toFixed(1)}`
        );
    } catch (err: any) {
        console.error("[ERROR] Failed to send telemetry:", err.response?.data || err.message);
    }
}

function tick() {
    const tSeconds = (Date.now() - startTime) / 1000;

    for (const profile of machineProfiles) {
        const sample = profile.behavior(tSeconds);
        sendSample(sample);
    }
}

console.log("Starting synthetic telemetry generator...");
setInterval(tick, INTERVAL_MS);