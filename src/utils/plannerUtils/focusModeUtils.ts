import { QueryClient } from "@tanstack/react-query";
import type { PlannerModule, PrereqTree } from "@/types";
import { removeModuleCodeWildCard, extractModulesFromTree } from "./prereqUtils";

export type FocusState = "focus" | "prereq" | "postreq";

export interface FocusResult {
    state: FocusState;
    distance: number;
}

export function generateFocusMap(
    focusedModule: string | null,
    board: Record<string, PlannerModule[]>,
    queryClient: QueryClient
): Record<string, FocusResult> {
    const map: Record<string, FocusResult> = {};
    if (!focusedModule) return map;

    const plannedModules = Object.values(board)
        .flat()
        .map((mod) => mod.moduleCode);
    const plannedSet = new Set(plannedModules);

    map[focusedModule] = { state: "focus", distance: 0 };

    // BFS to get all Pre-requisites and Distances
    const preQueue = [{ moduleCode: focusedModule, dist: 0 }];
    const preVisited = new Set<string>([focusedModule]);

    while (preQueue.length > 0) {
        const { moduleCode, dist } = preQueue.shift()!;
        const tree = queryClient.getQueryData<PrereqTree>(["prereq", moduleCode]);
        const directPreReqs = extractModulesFromTree(tree);

        for (const req of directPreReqs) {
            let matches: string[] = [];

            const hasWildcard = req.includes("%");

            if (hasWildcard) {
                const prefix = removeModuleCodeWildCard(req);
                matches = plannedModules.filter((m) => m.startsWith(prefix));
            } else {
                if (plannedSet.has(req)) matches.push(req);
            }

            for (const match of matches) {
                if (!preVisited.has(match)) {
                    preVisited.add(match);
                    map[match] = { state: "prereq", distance: dist + 1 };
                    preQueue.push({ moduleCode: match, dist: dist + 1 });
                }
            }
        }
    }

    // BFS to get all Post-requisites and Distances
    const postQueue = [{ moduleCode: focusedModule, dist: 0 }];
    const postVisited = new Set<string>([focusedModule]);

    while (postQueue.length > 0) {
        const { moduleCode, dist } = postQueue.shift()!;

        for (const boardMod of plannedModules) {
            if (postVisited.has(boardMod)) continue;

            const dependentTree = queryClient.getQueryData<PrereqTree>(["prereq", boardMod]);
            const dependencies = extractModulesFromTree(dependentTree);

            // If the board module's tree requires our current code
            const requiresCurrentNode = dependencies.some((dep) => {
                if (dep.includes("%")) {
                    const prefix = removeModuleCodeWildCard(dep);
                    return moduleCode.startsWith(prefix);
                }
                return dep === moduleCode;
            });

            if (requiresCurrentNode) {
                postVisited.add(boardMod);
                map[boardMod] = { state: "postreq", distance: dist + 1 };
                postQueue.push({ moduleCode: boardMod, dist: dist + 1 });
            }
        }
    }

    return map;
}
