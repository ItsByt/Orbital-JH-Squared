import { Ban, ChevronDown, Trash2 } from "lucide-react";
import { Draggable } from "@hello-pangea/dnd";
import type { PlannerModule } from "@/types";
import { usePlannerStore } from "@/store/usePlannerStore";
import { removeFromPlannerModuleDB, toggleExcludeInPlannerModuleDB } from "@/services/plannerDB";

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
    const isBeingDraggedInvalidly =
        dragState.isOverInvalidSem && dragState.draggingModuleCode === module.moduleCode;
    
    const removeModule = usePlannerStore((state) => state.removeModule);
    const setSemesterData = usePlannerStore((state) => state.setSemesterData);
    const toggleExclude = usePlannerStore((state) => state.toggleExcludeFromTotal);

    const handleDelete = async () => {
        const previousSemesterSnapshot = [...usePlannerStore.getState().board[semesterKey]];

        // Optimistic removal of module
        removeModule(semesterKey, module.moduleCode);

        const success = await removeFromPlannerModuleDB(module.moduleCode);

        if (!success) {
            setSemesterData(semesterKey, previousSemesterSnapshot);
        }
    };

    const handleToggle = async () => {
        toggleExclude("EXEMPTIONS", module.moduleCode);
        
        const success = await toggleExcludeInPlannerModuleDB(module.moduleCode);

        if (!success) {
            toggleExclude("EXEMPTIONS", module.moduleCode);
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
                    className={`relative group bg-[#3070b3] hover:bg-[#28619e] text-white p-2.5 rounded-md shadow-sm flex flex-col transition-colors duration-150
                        ${
                            snapshot.isDragging && isBeingDraggedInvalidly
                                ? "bg-red-600 animate-pulse ring-2 ring-red-400"
                                : "bg-[#3070b3] hover:bg-[#28619e]"
                        }
                            ${snapshot.isDragging && !isBeingDraggedInvalidly ? "shadow-xl opacity-90 ring-2 ring-white/50" : ""}
                            ${module.excludeFromTotal ? "bg-zinc-700 hover:bg-zinc-600" : "bg-[#3070b3] hover:bg-[#28619e]"}
                    `}
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
                                    className="text-red-400 focus:text-red-400 focus:bg-red-400/10 cursor-pointer"
                                >
                                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                                    <span>Remove Module</span>
                                </DropdownMenuItem>

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
