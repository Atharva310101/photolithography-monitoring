// generator/utils.ts

export function randBetween(min: number, max: number): number {
    return min + Math.random() * (max - min);
}

export function jitter(value: number, amount: number): number {
    return value + randBetween(-amount, amount);
}

export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

// Simple smooth oscillation (e.g., temperature drift)
export function smoothWave(t: number, base: number, amplitude: number, periodSeconds: number): number {
    const angle = (2 * Math.PI * t) / periodSeconds;
    return base + amplitude * Math.sin(angle);
}