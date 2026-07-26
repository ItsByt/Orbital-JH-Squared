import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { Droppable } from "@hello-pangea/dnd";
import { usePlannerStore } from "@/store/usePlannerStore";
import ModuleBlock from "./ModuleBlock";
import AddCourseModal from "./AddCourseModal";
import { EXEMPTION_KEY } from "@/utils/plannerUtils/semesterKeyUtils";
import { clearPlannerColumnDBBySemesterKey } from "@/services/plannerDB";

import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/generalUtils/getErrorMessage";
import { calculateStatistics } from "@/utils/plannerUtils/gpaCalculator";

export default function ExemptionRow() {
    const queryClient = useQueryClient();

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);

    const clearColumn = usePlannerStore((state) => state.clearColumn);
    const modules = usePlannerStore((state) => state.board[EXEMPTION_KEY]) || [];
    const moduleCount = modules.length;

    // For counting modules and units that are included
    const includedModules = modules.filter((mod) => !mod.excludeFromTotal);
    const exemptionUnits = includedModules.reduce((sum, mod) => sum + mod.moduleCredit, 0);
    const exemptionCount = includedModules.length;
    const stats = useMemo(() => calculateStatistics(includedModules), [includedModules]);

    const clearMutation = useMutation<void, Error>({
        mutationFn: async () => {
            await clearPlannerColumnDBBySemesterKey(EXEMPTION_KEY);
        },
        onSuccess: () => {
            clearColumn(EXEMPTION_KEY);
            toast.success("Exemptions cleared");
            setIsConfirming(false);
        },
        onError: (error) => {
            toast.error("Failed to clear exemptions", { description: getErrorMessage(error) });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["plannerBoard"] });
        },
    });

    return (
        <div
            data-testid="exemption-row"
            className="shrink-0 border-t border-zinc-200 dark:border-zinc-800 pt-5 px-6 pb-4 group"
        >
            <div className="mb-4 min-h-[44px] flex flex-col justify-start">
                {/* Top Row: Title & Actions */}
                <div className="flex justify-start gap-4 items-center min-h-[24px]">
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-[15px] uppercase tracking-wider leading-none">
                        Exemptions
                    </h3>

                    {moduleCount > 0 && (
                        <div
                            className={cn(
                                "flex items-center transition-all duration-200",
                                isConfirming || clearMutation.isPending
                                    ? "opacity-100 visible"
                                    : "text-zinc-500 hover:text-red-400 dark:hover:text-red-400 opacity-0 invisible group-hover:opacity-100 group-hover:visible"
                            )}
                        >
                            {clearMutation.isPending ? (
                                <Loader2 className="h-5 w-5 animate-spin text-red-500" />
                            ) : isConfirming ? (
                                <div className="flex items-center gap-2 text-[14px] font-bold">
                                    <span
                                        data-testid="confirm-clear-exemptions"
                                        onClick={() => clearMutation.mutate()}
                                        className="text-red-500 hover:text-red-400 hover:underline cursor-pointer"
                                    >
                                        Confirm?
                                    </span>
                                    <div
                                        onClick={() => setIsConfirming(false)}
                                        className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
                                    >
                                        <X className="h-5 w-5" />
                                    </div>
                                </div>
                            ) : (
                                <button
                                    data-testid="clear-exemptions-btn"
                                    onClick={() => setIsConfirming(true)}
                                    className="outline-none flex items-center"
                                >
                                    <Trash2 className="h-5 w-5 cursor-pointer" />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Bottom Row: Units */}
                {exemptionCount > 0 && !isConfirming && !clearMutation.isPending && (
                    <div data-testid="exemption-stats" className="mt-1">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                            {exemptionCount} Courses / {exemptionUnits} Units
                        </span>

                        {stats.gpa !== null && (
                            <>
                                <span className="text-zinc-500 dark:text-zinc-400 mx-1.5">•</span>
                                <span className="text-xs font-bold text-[#56A58B]">
                                    GPA: {stats.gpa.toFixed(2)}
                                </span>
                            </>
                        )}

                        {stats.suUsedCount > 0 && (
                            <>
                                <span className="text-zinc-500 dark:text-zinc-400 mx-1.5">•</span>
                                <span className="text-xs font-medium text-amber-500">
                                    {stats.suUsedCount} S/U Used
                                </span>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* The Row of Cards */}
            <Droppable droppableId={EXEMPTION_KEY} direction="horizontal">
                {/* Draggable snapshot properties -> isDraggingOver, draggingOverWith */}
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef} //attaches the DOM node
                        {...provided.droppableProps} //props needed for DnD
                        data-testid="droppable-zone-exemptions"
                        className={cn(
                            "flex flex-nowrap overflow-x-auto gap-4 min-h-[110px] w-max min-w-[500px] max-w-full p-4 rounded-md border border-dashed pb-4 scrollbar-thin scrollbar-thumb-zinc-700",
                            snapshot.isDraggingOver
                                ? "border-zinc-400 bg-zinc-100 dark:border-zinc-500 dark:bg-zinc-800/30"
                                : "border-zinc-300 dark:border-zinc-700"
                        )}
                    >
                        {modules.map((mod, index) => (
                            <div key={mod.moduleCode} className="w-[230px] shrink-0">
                                <ModuleBlock
                                    module={mod}
                                    semesterKey={EXEMPTION_KEY}
                                    index={index}
                                />
                            </div>
                        ))}
                        {provided.placeholder}
                        {/* Required by DnD to increase the space during a drag when needed*/}
                    </div>
                )}
            </Droppable>

            {/* Adding Exemptions */}
            <div className="mt-3">
                <button
                    data-testid="add-exemption-btn"
                    onClick={() => setIsSearchOpen(true)}
                    className="flex items-center text-[#ff5c5c] hover:text-[#ff7878] text-[13px] font-semibold transition-colors cursor-pointer"
                >
                    <Plus className="h-4 w-4 mr-1" /> Add Exemption
                </button>
            </div>

            {/* Search Modal */}
            <AddCourseModal
                open={isSearchOpen}
                onOpenChange={setIsSearchOpen}
                semesterKey={EXEMPTION_KEY}
            />
        </div>
    );
}
