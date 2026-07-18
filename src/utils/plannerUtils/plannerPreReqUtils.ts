import type { PrereqTree } from "@/types";
import { SEMESTER_CODES, EXEMPTION_KEY, parseSemesterKey } from "./semesterKeyUtils";

// Used to define the chronological order of semesters in the same year
const CHRONOLOGICAL_ORDER: Record<number, number> = {
    // Square brackets used to tell TypeScript to evaluate the expression inside the brackets,
    // and use its result as the property name
    [SEMESTER_CODES.EXEMPTIONS]: 0,
    [SEMESTER_CODES.SEM_1]: 1,
    [SEMESTER_CODES.WINTER_BREAK]: 2,
    [SEMESTER_CODES.SEM_2]: 3,
    [SEMESTER_CODES.SPECIAL_TERM_1]: 4,
    [SEMESTER_CODES.SPECIAL_TERM_2]: 5,
    [SEMESTER_CODES.SUMMER_BREAK]: 6,
};

// To ensure that the weightage for time of 1 year will always be larger than any individual semester
const YEAR_WEIGHT = Math.max(...Object.values(CHRONOLOGICAL_ORDER)) + 1;

// Assigns a chronological non-negative integer to each semester so we can compare time period
// Where smaller value means earlier
export const getSemesterAbsoluteTime = (semesterKey: string): number => {
    // Explicit for Exemptions (technically optional)
    if (semesterKey === EXEMPTION_KEY) return CHRONOLOGICAL_ORDER[SEMESTER_CODES.EXEMPTIONS];

    const { year, semester } = parseSemesterKey(semesterKey);

    const semesterWeight = CHRONOLOGICAL_ORDER[semester];

    if (semesterWeight === undefined) {
        throw new Error(
            `Developer Error: Unmapped chronological order for semester code ${semester}`
        );
    }

    return year * YEAR_WEIGHT + semesterWeight;
};

// Basic Module Pre-requisites come with the grade required (e.g. "CS1101S:D")
// So we need to remove it after getting the string
export const removeModuleCodeGrade = (code: string) => code.split(":")[0].trim();

// Used to extract the relevant section of the code string requirement from wildcard
export const removeModuleCodeWildCard = (code: string) => code.split("%")[0].trim();

// Evaluates if a tree is fulfilled based on the set of modules we have
// Returns true if tree is fulfilled and false if not
export function evaluatePrereqTree(
    tree: PrereqTree | null | undefined,
    takenSet: Set<string>
): boolean {
    if (!tree) return true; // No prereqs = fulfilled

    if (typeof tree === "string") {
        const cleanCode = removeModuleCodeGrade(tree);

        if (cleanCode.includes("%")) {
            const prefix = removeModuleCodeWildCard(cleanCode);
            return Array.from(takenSet).some((modCode) => modCode.startsWith(prefix));
        }

        return takenSet.has(cleanCode);
    }

    if ("and" in tree) return tree.and.every((child) => evaluatePrereqTree(child, takenSet));
    if ("or" in tree) return tree.or.some((child) => evaluatePrereqTree(child, takenSet));

    if ("nOf" in tree) {
        const requiredCount = tree.nOf[0];
        const childrenRequired = tree.nOf[1];
        let count = 0;

        for (const child of childrenRequired) {
            if (typeof child === "string" && child.includes("%")) {
                const prefix = removeModuleCodeWildCard(child);
                count += Array.from(takenSet).filter((modCode) =>
                    modCode.startsWith(prefix)
                ).length;
            } else {
                if (evaluatePrereqTree(child, takenSet)) count++;
            }
        }

        return count >= requiredCount;
    }

    // Fallback
    return true;
}

// Extracts a flat array of every module code mentioned in a tree
export function extractModulesFromTree(tree: PrereqTree | null | undefined): string[] {
    if (!tree) return [];
    if (typeof tree === "string") return [removeModuleCodeGrade(tree)];
    if ("and" in tree) return tree.and.flatMap(extractModulesFromTree);
    if ("or" in tree) return tree.or.flatMap(extractModulesFromTree);
    if ("nOf" in tree) {
        const childrenRequired = tree.nOf[1];
        return childrenRequired.flatMap(extractModulesFromTree);
    }
    return [];
}

// A node (module) is misplaced if it is placed too early / too late
export type NodeStatus = "VALID" | "MISPLACED" | "MISSING";
export type TrimmedPrereqResult = {
    tree: PrereqTree | null;
    status: NodeStatus;
    hasMisplaced: boolean;
    hasMissing: boolean;
};

export function createTrimResult(
    tree: PrereqTree | null,
    status: NodeStatus,
    hasMisplaced: boolean,
    hasMissing: boolean
): TrimmedPrereqResult {
    return { tree, status, hasMisplaced, hasMissing };
}

// Used to reduce the Pre-requisites of a module to just those already in the planner (if it is in the planner),
// else we keep all the pre-requisite options to display
export function trimPrereqTree(
    node: PrereqTree,
    boardMap: Record<string, { time: number; semKey: string }>,
    targetTime: number
): TrimmedPrereqResult {
    // If the module only has 1 Pre-requisite
    if (typeof node === "string") {
        const cleanedPreReqCode = removeModuleCodeGrade(node);
        let boardData = boardMap[cleanedPreReqCode];

        // If the requirement contains a wildcard
        if (cleanedPreReqCode.includes("%")) {
            const prefix = removeModuleCodeWildCard(cleanedPreReqCode);

            // Find the first module in the board that match the Prefix requirement
            const matchingModule = Object.keys(boardMap).find((modCode) =>
                modCode.startsWith(prefix)
            );

            if (matchingModule) boardData = boardMap[matchingModule];
        }

        // If the pre-req is in our board, either it is placed validly or misplaced
        if (boardData) {
            if (boardData.time < targetTime)
                return createTrimResult(cleanedPreReqCode, "VALID", false, false);
            return createTrimResult(cleanedPreReqCode, "MISPLACED", true, false);
        }

        // Else it is missing
        return createTrimResult(cleanedPreReqCode, "MISSING", false, true);
    }

    // For the case of "requires at least one"
    if ("or" in node) {
        // If any are valid, simplify the OR block to just the valid ones
        const results = node.or.map((child) => trimPrereqTree(child, boardMap, targetTime));

        const validResults = results.filter((r) => r.status === "VALID");
        if (validResults.length > 0) {
            // We use the non-null assertion operator (!) since we know it is neither undefined nor null
            const tree =
                validResults.length === 1
                    ? validResults[0].tree
                    : { or: validResults.map((r) => r.tree!) };
            return createTrimResult(tree, "VALID", false, false);
        }

        // If none of them are valid, but some of them are misplaced,
        // simplify the OR block to just the misplaced ones
        const misplacedResults = results.filter((r) => r.status === "MISPLACED");
        if (misplacedResults.length > 0) {
            const tree =
                misplacedResults.length === 1
                    ? misplacedResults[0].tree
                    : { or: misplacedResults.map((r) => r.tree!) };
            return createTrimResult(tree, "MISPLACED", true, false);
        }

        // Case where pre-requisite is missing
        return createTrimResult({ or: results.map((r) => r.tree!) }, "MISSING", false, true);
    }

    if ("and" in node) {
        const results = node.and.map((child) => trimPrereqTree(child, boardMap, targetTime));

        const hasMisplaced = results.some((result) => result.hasMisplaced);
        const hasMissing = results.some((result) => result.hasMissing);
        const allValid = results.every((result) => result.status === "VALID");
        const status: NodeStatus = allValid ? "VALID" : hasMisplaced ? "MISPLACED" : "MISSING";

        return createTrimResult(
            { and: results.map((r) => r.tree!) },
            status,
            hasMisplaced,
            hasMissing
        );
    }

    if ("nOf" in node) {
        const requiredCount = node.nOf[0];
        const childrenRequired = node.nOf[1];

        const results = childrenRequired.map((child) =>
            trimPrereqTree(child, boardMap, targetTime)
        );

        let validCount = 0;
        let misplacedCount = 0;

        childrenRequired.forEach((child, idx) => {
            // If the requirement contains a wildcard,
            // we need to count validCounts and mismatchCounts explicitly
            if (typeof child === "string" && child.includes("%")) {
                const prefix = removeModuleCodeWildCard(child);
                const matchingCodes = Object.keys(boardMap).filter((modCode) =>
                    modCode.startsWith(prefix)
                );

                validCount += matchingCodes.filter(
                    (modCode) => boardMap[modCode].time < targetTime
                ).length;

                misplacedCount += matchingCodes.filter(
                    (modCode) => boardMap[modCode].time >= targetTime
                ).length;

                // Else if it isn't a wildcard requirement,
                // it would have been processed fully by trimPrereqTree
            } else {
                if (results[idx].status === "VALID") validCount++;
                else if (results[idx].status === "MISPLACED") misplacedCount++;
            }
        });

        const hasMisplaced = misplacedCount > 0;
        const hasMissing = validCount + misplacedCount < requiredCount;

        let status: NodeStatus = "MISSING";
        if (validCount >= requiredCount) status = "VALID";
        else if (validCount + misplacedCount >= requiredCount) status = "MISPLACED";

        return createTrimResult(
            { nOf: [requiredCount, results.map((result) => result.tree!)] },
            status,
            hasMisplaced,
            hasMissing
        );
    }

    // Fallback
    return createTrimResult(null, "MISSING", false, false);
}
