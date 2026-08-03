import { Info } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

import { getModuleBlockStyles } from "@/utils/plannerUtils/moduleBlockStyles";
import type { PlannerModule } from "@/types";

export function FocusModeGuide() {
    // We create a dummy module to extract and re-use the Module Block Styles defined in moduleBlockStyles.tsx
    // Because we pass isFocusMode = true, the function skips checking module.excludeFromTotal
    const dummyModule = {} as PlannerModule;

    const activeClasses = getModuleBlockStyles(dummyModule, true, true, {
        state: "focus",
        distance: 0,
    });
    const unrelatedClasses = getModuleBlockStyles(dummyModule, true, true, undefined);

    // Extracting Prereq distances 1, 2, and 3
    const pre1 = getModuleBlockStyles(dummyModule, true, true, { state: "prereq", distance: 1 });
    const pre2 = getModuleBlockStyles(dummyModule, true, true, { state: "prereq", distance: 2 });
    const pre3 = getModuleBlockStyles(dummyModule, true, true, { state: "prereq", distance: 3 });

    // Extracting Postreq distances 1, 2, and 3
    const post1 = getModuleBlockStyles(dummyModule, true, true, { state: "postreq", distance: 1 });
    const post2 = getModuleBlockStyles(dummyModule, true, true, { state: "postreq", distance: 2 });
    const post3 = getModuleBlockStyles(dummyModule, true, true, { state: "postreq", distance: 3 });

    return (
        <HoverCard openDelay={200} closeDelay={100}>
            <HoverCardTrigger asChild>
                <button className="flex items-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors outline-none cursor-help">
                    <Info className="h-4 w-4" />
                    <span className="sr-only">Focus Mode Guide</span>
                </button>
            </HoverCardTrigger>

            <HoverCardContent
                className="w-[340px] p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl z-50"
                align="start"
            >
                <div className="space-y-5">
                    {/* Title & Description */}
                    <div>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3">
                            Focus Mode Guide
                        </h4>

                        <div className="flex flex-col gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                            <p>Toggle Focus Mode on and off using the "Focus Mode" button.</p>
                            <p>
                                Click a module while Focus Mode is on to "focus" on it. You can
                                select a different module to focus on by clicking on another module.
                                You can continue adding, removing, and dragging modules around while
                                Focus Mode is on.
                            </p>
                            <p>
                                Focusing on a module allows you to see all the modules you need to
                                take in order to take the focused module (including the
                                pre-requisites of pre-requisites),
                            </p>
                            <p>
                                and also allows you to see all the modules that require this module
                                (post-requisites) in any capacity (even those that do not have the
                                focused module as a direct pre-requisite but an indirect one
                                instead).
                            </p>
                        </div>
                    </div>

                    <hr className="border-zinc-200 dark:border-zinc-800" />

                    {/* Color Legend */}
                    <div className="space-y-3.5 text-xs font-medium">
                        {/* Selected Module */}
                        <div className="flex items-center gap-3">
                            <div className={`h-4 w-4 rounded-sm ${activeClasses}`}></div>
                            <span className="text-zinc-700 dark:text-zinc-300">
                                Selected Module
                            </span>
                        </div>

                        {/* Pre-requisites */}
                        <div className="flex items-center gap-3">
                            <div className="flex gap-1">
                                <div className={`h-4 w-4 rounded-sm ${pre1}`}></div>
                                <div className={`h-4 w-4 rounded-sm ${pre2}`}></div>
                                <div className={`h-4 w-4 rounded-sm ${pre3}`}></div>
                            </div>
                            <span className="text-zinc-700 dark:text-zinc-300 flex flex-col leading-tight">
                                <span>Pre-requisites</span>
                                <span className="text-[10px] text-zinc-400 font-normal mt-0.5">
                                    (Brighter = More Direct)
                                </span>
                            </span>
                        </div>

                        {/* Post-requisites */}
                        <div className="flex items-center gap-3">
                            <div className="flex gap-1">
                                <div className={`h-4 w-4 rounded-sm ${post1}`}></div>
                                <div className={`h-4 w-4 rounded-sm ${post2}`}></div>
                                <div className={`h-4 w-4 rounded-sm ${post3}`}></div>
                            </div>
                            <span className="text-zinc-700 dark:text-zinc-300 flex flex-col leading-tight">
                                <span>Post-requisites</span>
                                <span className="text-[10px] text-zinc-400 font-normal mt-0.5">
                                    (Brighter = More Direct)
                                </span>
                            </span>
                        </div>

                        {/* Unrelated */}
                        <div className="flex items-center gap-3">
                            <div className={`h-4 w-4 rounded-sm ${unrelatedClasses}`}></div>
                            <span className="text-zinc-700 dark:text-zinc-300">
                                Unrelated Modules
                            </span>
                        </div>
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
}
