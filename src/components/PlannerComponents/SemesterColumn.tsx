import { useState, useEffect, useRef } from "react";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { Droppable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/generalUtils/getErrorMessage";
import { usePlannerStore } from "@/store/usePlannerStore";
import { clearPlannerColumnDBBySemesterKey } from "@/services/plannerDB";
import ModuleBlock from "./ModuleBlock";
import AddCourseModal from "./AddCourseModal";

interface SemesterColumnProps {
    title: string; //Format: Semester 1
    semesterKey: string;
    isCustom?: boolean;
}

export default function SemesterColumn({
    title,
    semesterKey,
    isCustom = false,
}: SemesterColumnProps) {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false); // Used for when in confirmation
    const [isDeleting, setIsDeleting] = useState(false); // Used for when actually clearing

    const modules = usePlannerStore((state) => state.board[semesterKey]) || [];
    const moduleCount = modules.length;
    const semUnits = modules.reduce((sum, mod) => sum + mod.moduleCredit, 0);

    const clearColumn = usePlannerStore((state) => state.clearColumn);
    const clearAndHideColumn = usePlannerStore((state) => state.clearAndHideColumn);
    const dragState = usePlannerStore((state) => state.dragState);

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

            // Pessimistic update
            if (modules.length > 0) {
                await clearPlannerColumnDBBySemesterKey(semesterKey);
            }

            // Only if DB update succeeds, update visual state
            if (isCustom) {
                clearAndHideColumn(semesterKey);
                toast.success(`${title} cleared and hidden`);
            } else {
                clearColumn(semesterKey);
                toast.success(`${title} cleared`);
            }
        } catch (error) {
            toast.error("Failed to clear modules", {
                description: getErrorMessage(error),
            });
        } finally {
            if (isMounted.current) {
                setIsConfirming(false);
                setIsDeleting(false);
            }
        }
    };

    const showClearButton = modules.length > 0 || isCustom;

    return (
        <div className={cn("flex flex-col group w-[230px] shrink-0 h-max")}>
            <div className="mb-3 px-1 min-h-[44px] flex flex-col justify-start">
                {/* Top Row: Title & Actions */}
                <div className="flex justify-between items-center gap-2 min-h-[24px]">
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-[15px] leading-none shrink-0 truncate">
                        {title}
                    </h3>

                    {showClearButton && (
                        <div
                            className={cn(
                                "flex items-center transition-all duration-200 shrink-0",
                                isConfirming || isDeleting
                                    ? "opacity-100 visible"
                                    : cn(
                                          "text-zinc-500 hover:text-red-400",
                                          isCustom
                                              ? "opacity-100 visible"
                                              : "opacity-0 invisible group-hover:opacity-100 group-hover:visible"
                                      )
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
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsConfirming(false);
                                        }}
                                        className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
                                        title="Cancel"
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
                {modules.length > 0 && !isConfirming && !isDeleting && (
                    <div className="mt-1">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                            {moduleCount} Courses / {semUnits} Units
                        </span>
                    </div>
                )}
            </div>

            {/* The Stack of Cards */}
            <Droppable droppableId={semesterKey}>
                {/* Draggable snapshot properties -> isDraggingOver, draggingOverWith */}
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef} //attaches the DOM node
                        {...provided.droppableProps} //props needed for DnD
                        className={cn(
                            "flex flex-col gap-2 flex-1 overflow-y-auto pr-1 pb-2 min-h-[100px] min-h-0",
                            snapshot.isDraggingOver &&
                                !dragState.isOverInvalidSem &&
                                "shadow-xl opacity-90 ring-2 ring-white/50",
                            snapshot.isDraggingOver &&
                                dragState.isOverInvalidSem &&
                                "ring-2 ring-red-500/70 bg-red-950/20"
                        )}
                    >
                        {modules.map((mod, index) => (
                            <ModuleBlock
                                key={mod.moduleCode}
                                module={mod}
                                semesterKey={semesterKey}
                                index={index}
                            />
                        ))}
                        {provided.placeholder}
                        {/* Required by DnD to increase the space during a drag when needed*/}
                    </div>
                )}
            </Droppable>

            {/* Adding Courses*/}
            <div className="mt-3 shrink-0">
                <button
                    onClick={() => setIsSearchOpen(true)}
                    className="flex items-center text-[#ff5c5c] hover:text-[#ff7878] text-[13px] font-semibold transition-colors cursor-pointer"
                >
                    <Plus className="h-4 w-4 mr-1" /> Add Courses
                </button>
            </div>

            {/* Search Modal */}
            <AddCourseModal
                open={isSearchOpen}
                onOpenChange={setIsSearchOpen}
                semesterKey={semesterKey}
            />
        </div>
    );
}
