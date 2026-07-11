import type { PlannerModule } from "@/types";
import type { FocusResult } from "./focusModeUtils";

export function getModuleBlockStyles(
    module: PlannerModule,
    isFocusMode: boolean,
    hasActiveFocus: boolean,
    focusStatus?: FocusResult
): string {
    // Focus Mode is Off (Default State)
    if (!isFocusMode) {
        return module.excludeFromTotal
            ? "bg-zinc-700 hover:bg-zinc-600"
            : "bg-[#3070b3] hover:bg-[#28619e]";
    }

    // Focus Mode is ON, but no module is selected
    if (!hasActiveFocus) {
        return "bg-[#3070b3]/80 hover:bg-[#3070b3] ring-1 ring-white/30 cursor-pointer";
    }

    // Unrelated Modules
    if (!focusStatus) {
        return "bg-zinc-800/50 text-white/40 grayscale border border-zinc-700/50 hover:bg-zinc-700/60 hover:text-white/70 cursor-pointer";
    }

    // Actively Selected Module
    if (focusStatus.state === "focus") {
        return "bg-blue-600 shadow-lg ring-2 ring-inset ring-blue-400 z-10 cursor-pointer text-white";
    }

    // Color will be the same for distance >= 5
    const dist = Math.min(focusStatus.distance, 5);

    // Pre-requisites
    if (focusStatus.state === "prereq") {
        const greens = [
            "bg-emerald-600 dark:bg-emerald-600 text-white shadow-md ring-2 ring-inset ring-emerald-400",
            "bg-emerald-500/80 dark:bg-emerald-800/90 text-white ring-1 ring-inset ring-emerald-300 dark:ring-emerald-600/60",
            "bg-emerald-300/60 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-100/70",
            "bg-emerald-200/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200/50",
            "bg-emerald-100/40 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400/30",
        ];
        return `${greens[dist - 1]} cursor-pointer`;
    }

    // Post-requisites
    if (focusStatus.state === "postreq") {
        const reds = [
            "bg-rose-600 dark:bg-rose-600 text-white shadow-md ring-2 ring-inset ring-rose-400",
            "bg-rose-500/80 dark:bg-rose-800/90 text-white ring-1 ring-inset ring-rose-300 dark:ring-rose-600/60",
            "bg-rose-300/60 dark:bg-rose-950/80 text-rose-950 dark:text-rose-100/70",
            "bg-rose-200/50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200/50",
            "bg-rose-100/40 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400/30",
        ];
        return `${reds[dist - 1]} cursor-pointer`;
    }

    return "";
}
