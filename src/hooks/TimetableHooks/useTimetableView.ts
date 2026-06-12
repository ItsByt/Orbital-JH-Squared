import { useMemo } from "react";
import type { DisplayLesson } from "@/types";

export function useTimetableView(modules: DisplayLesson[], alternatives: DisplayLesson[]) {
    // Optimisation:
    // Group lessons by day only when modules or alternatives change.
    // and process all logic here once
    const lessonsByDay = useMemo(() => {
        const grouped: Record<string, DisplayLesson[]> = {
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: [],
        };

        modules.forEach((mod) => {
            if (grouped[mod.day]) grouped[mod.day].push(mod);
        });

        alternatives.forEach((alt) => {
            const exists = modules.some(
                (mod) =>
                    mod.moduleCode === alt.moduleCode &&
                    mod.classNo === alt.classNo &&
                    mod.day === alt.day &&
                    mod.startTime === alt.startTime
            );

            if (!exists && grouped[alt.day]) {
                grouped[alt.day].push({
                    ...alt,
                    isAlternative: true,
                    weekBitmask: alt.weekBitmask,
                });
            }
        });

        return grouped;
    }, [modules, alternatives]);

    // Ensures single instance of module represented in Active Container
    // instead of duplicates (different class types) obtained from useTimetableData
    const uniqueActiveModules = useMemo(() => {
        const seen = new Set<string>();

        return modules.filter((mod) => {
            if (!mod) return false;

            if (mod.lessonType === "Personal Block") {
                return true; // all individual custom blocks stay in the list
            }

            // Deduplicate regular academic modules
            if (seen.has(mod.moduleCode)) return false;
            seen.add(mod.moduleCode);
            return true;
        });
    }, [modules]);

    // Tracks number of custom block names active using Dictionary (Record)
    const customNameCounts = useMemo(() => {
        const counts: Record<string, number> = {};

        uniqueActiveModules.forEach((mod) => {
            if (mod && mod.lessonType === "Personal Block") {
                const nameKey = mod.moduleCode.toUpperCase();
                counts[nameKey] = (counts[nameKey] || 0) + 1;
            }
        });

        return counts;
    }, [uniqueActiveModules]);

    return {
        lessonsByDay,
        uniqueActiveModules,
        customNameCounts,
    };
}
