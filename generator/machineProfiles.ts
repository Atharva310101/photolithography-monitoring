// generator/machineProfiles.ts

import { jitter, clamp, smoothWave, randBetween } from "./utils";

export type TelemetrySample = {
    machineId: number;
    temperature: number;
    pressure: number;
    alignment_error: number;
    throughput: number;
};

export type MachineProfile = {
    machineId: number;
    name: string;
    behavior: (t: number, prev?: TelemetrySample) => TelemetrySample;
};

// Baseline ranges
const BASE_TEMP = 72;
const TEMP_AMP = 3;          // +/- 3 degrees
const TEMP_PERIOD = 300;     // 5 minutes

const BASE_PRESSURE = 1.0;
const PRESSURE_JITTER = 0.02;

const BASE_ALIGNMENT = 0.005;
const ALIGNMENT_JITTER = 0.002;

const BASE_THROUGHPUT = 150;
const THROUGHPUT_JITTER = 10;

// Normal machine
function normalBehavior(machineId: number, t: number): TelemetrySample {
    const temperature = smoothWave(t, BASE_TEMP, TEMP_AMP, TEMP_PERIOD);
    const pressure = jitter(BASE_PRESSURE, PRESSURE_JITTER);
    const alignment_error = clamp(jitter(BASE_ALIGNMENT, ALIGNMENT_JITTER), 0, 0.02);
    const throughput = clamp(jitter(BASE_THROUGHPUT, THROUGHPUT_JITTER), 120, 180);

    return { machineId, temperature, pressure, alignment_error, throughput };
}

// Machine with occasional temperature spikes
function tempSpikeBehavior(machineId: number, t: number): TelemetrySample {
    let base = normalBehavior(machineId, t);

    // 2% chance of a spike
    if (Math.random() < 0.02) {
        console.log("🔥 TEMP SPIKE for machine 2");
        base.temperature += randBetween(5, 12); // big spike
    }

    return base;
}

// Machine with alignment drift over time
function alignmentDriftBehavior(machineId: number, t: number): TelemetrySample {
    let base = normalBehavior(machineId, t);

    // Slow drift upward over time
    const drift = (t / 600) * 0.005; // every 10 minutes, add up to 0.005
    base.alignment_error = clamp(base.alignment_error + drift, 0, 0.05);

    return base;
}

// Machine with periodic throughput drops
function throughputDropBehavior(machineId: number, t: number): TelemetrySample {
    let base = normalBehavior(machineId, t);

    // Every ~5 minutes, for ~30 seconds, throughput collapses
    const cycle = (t % 300); // 300 seconds = 5 minutes
    if (cycle < 30) {
        base.throughput = clamp(randBetween(40, 80), 0, 180);
    }

    return base;
}

export const machineProfiles: MachineProfile[] = [
    {
        machineId: 1,
        name: "Stepper A1 (normal)",
        behavior: (t) => normalBehavior(1, t),
    },
    {
        machineId: 2,
        name: "Stepper B2 (temp spikes)",
        behavior: (t) => tempSpikeBehavior(2, t),
    },
    {
        machineId: 3,
        name: "Stepper C3 (alignment drift)",
        behavior: (t) => alignmentDriftBehavior(3, t),
    },
    {
        machineId: 4,
        name: "Stepper D4 (throughput drops)",
        behavior: (t) => throughputDropBehavior(4, t),
    },
];