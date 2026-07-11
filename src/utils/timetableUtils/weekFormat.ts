// Convert weeks array to bitmask
export function weeksToBitmask(weeks: Array<number | string>): number {
    if (!Array.isArray(weeks)) return 0;
    return weeks.reduce<number>((mask, week) => {
        const weekNum: number =
            typeof week === "number" ? week : parseInt(week, 10);
        return mask | (1 << (weekNum - 1));
    }, 0);
}

// Convert bitmask to weeks array
export function bitmaskToWeeks(bitmask: number): number[] {
    const weeks: number[] = [];
    for (let week = 1; week <= 13; week++) {
        if ((bitmask & (1 << (week - 1))) !== 0) {
            weeks.push(week);
        }
    }
    return weeks;
}

// Parsing saved weeks
export function parseSavedWeeks(weeks: string | null): number[] {
    if (!weeks) return [];
    try {
        const parsed = JSON.parse(weeks);
        if (!Array.isArray(parsed)) return [];
        return parsed.map((w) => Number(w)).filter(Boolean);
    } catch {
        return [];
    }
}

// Format weeks array for display e.g. "Weeks 3-13"
export function formatWeeksDisplay(selectedWeeks: number[]): string {
    if (!selectedWeeks || selectedWeeks.length === 0) return "No weeks selected";
    if (selectedWeeks.length === 13) return "Weeks 1-13";

    const sorted = [...selectedWeeks].sort((a, b) => a - b);
    const ranges: string[] = [];
    let start = sorted[0];
    let end = sorted[0];

    for (let i = 1; i <= sorted.length; i++) {
        if (i < sorted.length && sorted[i] === end + 1) {
            end = sorted[i]; // Stretch Weeks End Pointer until disjoint
        } else {
            if (start === end) {
                ranges.push(`Week ${start}`); // Single week disjoint
            } else {
                ranges.push(`${start}-${end}`); // Continuous weeks disjoint
            }
            if (i < sorted.length) {
                start = sorted[i];
                end = sorted[i];
            } // Reset pointers to after disjoint next sequence
        }
    }
    const output = ranges.join(", ");
    return output.startsWith("Week") ? output : `Weeks ${output}`;
}
