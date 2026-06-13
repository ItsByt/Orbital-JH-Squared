import { useEffect, useRef, useState } from "react";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { Droppable } from "@hello-pangea/dnd";
import { usePlannerStore } from "@/store/usePlannerStore";
import ModuleBlock from "./ModuleBlock";
import AddCourseModal from "./AddCourseModal";
import { EXEMPTION_KEY } from "@/utils/plannerUtils/semesterKeyUtils";
import { cn } from "@/lib/utils";
import { clearPlannerColumnDBBySemesterKey } from "@/services/plannerDB";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/generalUtils/getErrorMessage";

export default function ExemptionRow() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const clearColumn = usePlannerStore((state) => state.clearColumn);

    const modules = usePlannerStore((state) => state.board[EXEMPTION_KEY]) || [];

    // For counting modules and units that are included
    const includedModules = modules.filter((mod) => !mod.excludeFromTotal);
    const exemptionUnits = includedModules.reduce((sum, mod) => sum + mod.moduleCredit, 0);
    const exemptionCount = includedModules.length;

    const isMounted = useRef(true);
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const handleClear = async () => {
        if (isDeleting) return;

        if (!isConfirming) {
            setIsConfirming(true);
            return;
        }

        try {
            setIsDeleting(true);
            await clearPlannerColumnDBBySemesterKey(EXEMPTION_KEY);
            clearColumn(EXEMPTION_KEY);
            toast.success("Exemptions cleared");
        } catch (error) {
            toast.error("Failed to clear exemptions", {
                description: getErrorMessage(error),
            });
        } finally {
            if (isMounted.current) {
                setIsConfirming(false);
                setIsDeleting(false);
            }
        }
    };

    return (
        <div className="shrink-0 border-t border-zinc-800 pt-3 px-6 pb-3 group">
            <div className="mb-4 min-h-[44px] flex flex-col justify-start">
                {/* Top Row: Title & Actions */}
                <div className="flex justify-start gap-4 items-center min-h-[24px]">
                    <h3 className="font-bold text-zinc-100 text-[15px] uppercase tracking-wider leading-none">
                        Exemptions
                    </h3>

                    {modules.length > 0 && (
                        <div
                            className={cn(
                                "flex items-center transition-all duration-200",
                                isConfirming || isDeleting
                                    ? "opacity-100 visible"
                                    : "text-zinc-500 hover:text-red-400 opacity-0 invisible group-hover:opacity-100 group-hover:visible"
                            )}
                        >
                            {isDeleting ? (
                                <Loader2 className="h-5 w-5 animate-spin text-red-500" />
                            ) : isConfirming ? (
                                <div className="flex items-center gap-2 text-[14px] font-bold">
                                    <span
                                        onClick={handleClear}
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
                                    onClick={handleClear}
                                    className="outline-none flex items-center"
                                >
                                    <Trash2 className="h-5 w-5 cursor-pointer" />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Bottom Row: Units */}
                {exemptionCount > 0 && !isConfirming && !isDeleting && (
                    <div className="mt-1">
                        <span className="text-xs text-zinc-400 font-medium">
                            {exemptionCount} Courses / {exemptionUnits} Units
                        </span>
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
                        className={cn(
                            "flex flex-nowrap overflow-x-auto gap-4 min-h-[110px] w-max min-w-[500px] max-w-full p-4 rounded-md border border-dashed pb-4 scrollbar-thin scrollbar-thumb-zinc-700",
                            snapshot.isDraggingOver
                                ? "border-zinc-500 bg-zinc-800/30"
                                : "border-zinc-700"
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
