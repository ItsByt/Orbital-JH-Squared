import { useState, useRef } from "react";
import { Ban, ChevronDown, Trash2 } from "lucide-react";
import { Draggable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { PlannerModule } from "@/types";
import { usePlannerStore } from "@/store/usePlannerStore";
import { removeFromPlannerModuleDB, setExcludeInPlannerModuleDB } from "@/services/plannerDB";
import { getErrorMessage } from "@/utils/generalUtils/getErrorMessage";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ModuleBlockProps {
    module: PlannerModule;
    semesterKey: string;
    index: number;
}

export default function ModuleBlock({ module, semesterKey, index }: ModuleBlockProps) {
    const dragState = usePlannerStore((state) => state.dragState);
    const removeModule = usePlannerStore((state) => state.removeModule);
    const setSemesterData = usePlannerStore((state) => state.setSemesterData);
    const toggleExclude = usePlannerStore((state) => state.toggleExcludeFromTotal);

    const [isDeleting, setIsDeleting] = useState(false);
    const lockRef = useRef(false); // Used to lock removal state

    const isBeingDraggedInvalidly =
        dragState.isOverInvalidSem && dragState.draggingModuleCode === module.moduleCode;

    const handleDelete = async () => {
        if (lockRef.current) return;

        const previousSemesterSnapshot = [...usePlannerStore.getState().board[semesterKey]];

        try {
            lockRef.current = true;
            setIsDeleting(true);

            // Optimistic removal of module
            removeModule(semesterKey, module.moduleCode);

            await removeFromPlannerModuleDB(module.moduleCode);
            toast.success(`${module.moduleCode} removed from your planner.`);
        } catch (error) {
            // Rollback on error
            setSemesterData(semesterKey, previousSemesterSnapshot);
            toast.error("Failed to remove module", { description: getErrorMessage(error) });
        } finally {
            lockRef.current = false;
            setIsDeleting(false);
        }
    };

    const handleToggle = async () => {
        const targetValue = !module.excludeFromTotal;

        try {
            toggleExclude(semesterKey, module.moduleCode);

            await setExcludeInPlannerModuleDB(module.moduleCode, targetValue);
        } catch (error) {
            // Rollback on error
            toggleExclude(semesterKey, module.moduleCode);
            toast.error("Failed to update module status", { description: getErrorMessage(error) });
        }
    };

    return (
        <Draggable draggableId={module.moduleCode} index={index}>
            {/* Draggable snapshot properties -> isDragging, draggingOver */}
            {(provided, snapshot) => (
                // Block background, text color, and hover effects
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={cn(
                        "relative group p-2.5 rounded-md shadow-sm flex flex-col transition-colors duration-150 text-white",
                        module.excludeFromTotal
                            ? "bg-zinc-700 hover:bg-zinc-600"
                            : "bg-[#3070b3] hover:bg-[#28619e]",
                        snapshot.isDragging &&
                            !isBeingDraggedInvalidly &&
                            "shadow-xl opacity-90 ring-2 ring-white/50",
                        snapshot.isDragging &&
                            isBeingDraggedInvalidly &&
                            "bg-red-600 animate-pulse ring-2 ring-red-400"
                    )}
                    style={{ ...provided.draggableProps.style }}
                >
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-[12px] font-bold tracking-tight leading-none">
                            {module.moduleCode}
                        </span>

                        {/* Dropdown Menu triggered by Chevron */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="hover:bg-black/20 rounded p-0.5 transition-colors cursor-pointer outline-none">
                                    <ChevronDown size={14} className="text-white/80" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-40 bg-[#18181a] border-zinc-800 text-zinc-300"
                            >
                                {/* Removing a module */}
                                <DropdownMenuItem
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className={cn(
                                        "text-red-400 focus:text-red-400 focus:bg-red-400/10 cursor-pointer",
                                        isDeleting && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                                    <span>{isDeleting ? "Removing..." : "Remove Module"}</span>
                                </DropdownMenuItem>

                                {/* For toggling Excluding From Total*/}
                                {module.isExemption && (
                                    <DropdownMenuItem
                                        onClick={handleToggle}
                                        className="cursor-pointer"
                                    >
                                        <Ban className="mr-2 h-3.5 w-3.5" />
                                        <span>
                                            {module.excludeFromTotal
                                                ? "Include in Totals"
                                                : "Exclude from Totals"}
                                        </span>
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <span className="text-[10px] font-medium leading-[1.2] text-black/90 line-clamp-2 pr-2">
                        {module.title}
                    </span>

                    <div className="mt-2 flex justify-start text-[10px] font-medium text-white/70">
                        <span>{module.moduleCredit} Units</span>
                    </div>
                </div>
            )}
        </Draggable>
    );
}
