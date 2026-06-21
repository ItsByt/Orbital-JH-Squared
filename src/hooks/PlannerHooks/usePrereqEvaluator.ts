import { useMemo } from "react";
import { usePlannerStore } from "@/store/usePlannerStore";
import { useModulePrereq } from "./useModulePrereq";
import { EXEMPTION_KEY } from "@/utils/plannerUtils/semesterKeyUtils";
import {
    getSemesterAbsoluteTime,
    trimPrereqTree,
    evaluatePrereqTree,
    extractModulesFromTree,
} from "@/utils/plannerUtils/prereqUtils";

export function usePrereqEvaluator(moduleCode: string, semesterKey: string) {
    const board = usePlannerStore((state) => state.board);
    const prereqCache = usePlannerStore((state) => state.prereqCache);
    const prereqTree = useModulePrereq(moduleCode);

    // Map all modules on the board to their absolute time and semesterKey
    const boardMap = useMemo(() => {
        const map: Record<string, { time: number; semKey: string }> = {};
        Object.entries(board).forEach(([semKey, modules]) => {
            const time = getSemesterAbsoluteTime(semKey);
            modules.forEach((mod) => {
                map[mod.moduleCode] = { time, semKey };
            });
        });
        return map;
    }, [board]);

    const targetTime = getSemesterAbsoluteTime(semesterKey);

    // boardMap without the module itself (to prevent counting itself for nOf case)
    const filteredBoardMap = useMemo(() => {
        const newMap = { ...boardMap };
        delete newMap[moduleCode];
        return newMap;
    }, [boardMap, moduleCode]);

    // Check if this module's pre-requisites are met
    const takenTooEarlyIssues = useMemo(() => {
        try {
            if (!prereqTree || semesterKey === EXEMPTION_KEY) return null;

            const result = trimPrereqTree(prereqTree, filteredBoardMap, targetTime);

            // If pre-requisites are fully satisfied
            if (result.status === "VALID") return null;

            // result contains { tree, status, hasMisplaced }
            return result;
        } catch (error) {
            console.error(`Pre-req forward evaluation failed for ${moduleCode}:`, error);
            return null;
        }
    }, [prereqTree, filteredBoardMap, targetTime, semesterKey, moduleCode]);

    // Check if this module is a pre-requisite for other modules, but is taken too late
    const takenTooLateIssues = useMemo(() => {
        try {
            const issues: { modCode: string; semKey: string; time: number }[] = [];
            if (semesterKey === EXEMPTION_KEY) return issues;

            Object.entries(board).forEach(([semKey, modules]) => {
                const dependentTime = getSemesterAbsoluteTime(semKey);

                // dependentMod is the mod that we check if it depends on our current module
                modules.forEach((dependentMod) => {
                    // Ignore checks against ourselves
                    if (dependentMod.moduleCode === moduleCode) return;

                    const dependentTree = prereqCache[dependentMod.moduleCode];
                    if (!dependentTree) return;

                    // We check if the dependent (other) module's requirements are fulfilled
                    const takenSet = new Set(
                        Object.keys(boardMap).filter(
                            (code) =>
                                code !== dependentMod.moduleCode &&
                                boardMap[code].time < dependentTime
                        )
                    );

                    if (!evaluatePrereqTree(dependentTree, takenSet)) {
                        // It is unfulfilled
                        // Now we check if we are part of those missing requirements
                        const inTree = extractModulesFromTree(dependentTree).includes(moduleCode);

                        // And we check if we are also placed too late relative to the dependent module
                        if (inTree && targetTime >= dependentTime) {
                            issues.push({
                                modCode: dependentMod.moduleCode,
                                semKey: semKey,
                                time: dependentTime,
                            });
                        }
                    }
                });
            });
            return issues;
        } catch (error) {
            return [];
        }
    }, [board, prereqCache, boardMap, targetTime, moduleCode, semesterKey]);

    const hasAnyPreReqWarning = takenTooEarlyIssues !== null || takenTooLateIssues.length > 0;

    return {
        filteredBoardMap,
        targetTime,
        takenTooEarlyIssues,
        takenTooLateIssues,
        hasAnyPreReqWarning,
    };
}
