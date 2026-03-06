/**
 * Deterministic RNG Service
 * Implements a mulberry32 PRNG paired with a simple string hasher for seeds.
 */

// Simple string hash to generate a seed
export function cyrb128(str: string): [number, number, number, number] {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    h1 ^= (h2 ^ h3 ^ h4), h2 ^= h1, h3 ^= h1, h4 ^= h1;
    return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

// Mulberry32 RNG
export function mulberry32(a: number) {
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

export class RNG {
    private seedValue: string;
    private generator: () => number;

    constructor(seedString: string) {
        this.seedValue = seedString;
        const seedHashes = cyrb128(seedString);
        this.generator = mulberry32(seedHashes[0]);
    }

    /** Returns a random number between 0 (inclusive) and 1 (exclusive) */
    public next(): number {
        return this.generator();
    }

    /** Returns a random integer between min (inclusive) and max (exclusive) */
    public nextInt(min: number, max: number): number {
        return Math.floor(this.generator() * (max - min) + min);
    }

    /** Returns a random element from an array */
    public randomElement<T>(arr: T[]): T {
        return arr[this.nextInt(0, arr.length)];
    }

    /** Returns a shuffled copy of the array */
    public shuffle<T>(arr: T[]): T[] {
        const result = [...arr];
        for (let i = result.length - 1; i > 0; i--) {
            const j = this.nextInt(0, i + 1);
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    public getSeed(): string {
        return this.seedValue;
    }
}
