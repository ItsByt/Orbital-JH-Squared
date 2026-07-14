import { FontSizePairing, FontFamilyOption } from "@/store/useSettingsStore";

// Planner constants
export const TOTAL_PLANNER_YEARS = 5;

// Timetable constants
export const TIMETABLE_WEEKS = Array.from({ length: 13 }, (_, i) => i + 1);
export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const TIMETABLE_START_HOUR = 8; // 0800
export const TIMETABLE_END_HOUR = 20; // 2000
export const TOTAL_HOURS = TIMETABLE_END_HOUR - TIMETABLE_START_HOUR;
export const GRID_COLUMNS_PER_HOUR = 2; // 30-min blocks

export const TIMETABLE_HOURS = Array.from({ length: TOTAL_HOURS }, (_, i) => {
    const hour = TIMETABLE_START_HOUR + i;
    return `${hour.toString().padStart(2, "0")}00`;
});

// Settings constants
export const START_HOURS_SETTING = Array.from({ length: 16 }, (_, i) => i + 5); // 5 to 20
export const END_HOURS_SETTING = Array.from({ length: 15 }, (_, i) => i + 10); // 10 to 24

export const FONT_SIZES: FontSizePairing[] = ["small", "regular", "large"];

export const FONT_FAMILIES: readonly {
    id: FontFamilyOption;
    label: string;
    style: string;
}[] = [
    { id: "sans", label: "Sans (Geist)", style: "font-sans" },
    { id: "mono", label: "Monospace", style: "font-mono" },
    { id: "bahnschrift", label: "Bahnschrift", style: "font-['Bahnschrift']" },
    { id: "atkinson", label: "Atkinson", style: "font-atkinson" },
    { id: "inter", label: "Inter", style: "font-inter" },
    { id: "lexend", label: "Lexend", style: "font-lexend" },
] as const;