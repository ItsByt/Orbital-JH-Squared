// Convert weeks array to bitmask
export function weeksToBitmask(weeks: Array<number | string>): number {
    if (!Array.isArray(weeks)) return 0;
    return weeks.reduce<number>((mask, week) => {
        const weekNum = typeof week === "number" ? week : parseInt(week, 10);
        return mask | (1 << (weekNum - 1));
    }, 0);
}

// Convert bitmask to weeks array
export function bitmaskToWeeks(bitmask: number): number[] {
    const weeks: number[] = [];
    let week = 1;
    while (bitmask > 0) {
        if (bitmask & 1) weeks.push(week);
        bitmask >>= 1;
        week++;
    }
    return weeks;
}

// Parsing saved weeks
export function parseSavedWeeks(weeks: string | null): number[] {
    if (!weeks) return [];
    try {
        const parsed = JSON.parse(weeks);
        if (!Array.isArray(parsed)) return [];
        return parsed.map(w => Number(w)).filter(Boolean);
    } catch {
        return [];
    }
}

// Format weeks array for display e.g. "Weeks 3-13"
export function formatWeeks(weeks: number[]): string {
    if (!weeks.length) return "";
    weeks.sort((a, b) => a - b);
    const ranges: string[] = [];
    let start = weeks[0];
    let prev = weeks[0];
    for (let i = 1; i < weeks.length; i++) {
        const w = weeks[i];
        if (w === prev + 1) {
            prev = w;
            continue;
        }
        ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
        start = w;
        prev = w;
    }
    ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
    return `Weeks ${ranges.join(", ")}`;
}
