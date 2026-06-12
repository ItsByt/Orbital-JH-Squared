import { useState } from "react";
import { Plus } from "lucide-react";
import { Droppable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { usePlannerStore } from "@/store/usePlannerStore";
import ModuleBlock from "./ModuleBlock";
import AddCourseModal from "./AddCourseModal";

interface SemesterColumnProps {
    title: string; //Format: Semester 1
    semesterKey: string;
    isInvalidDropTarget: boolean;
}

export default function SemesterColumn({
    title,
    semesterKey,
    isInvalidDropTarget,
}: SemesterColumnProps) {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const modules = usePlannerStore((state) => state.board[semesterKey]) || [];
    const semUnits = modules.reduce((sum, mod) => sum + mod.moduleCredit, 0);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex justify-between items-center mb-2 px-0.5">
                <h3 className="font-bold text-zinc-300 text-[11px]">{title}</h3>
                {semUnits > 0 && (
                    <span className="text-[10px] text-zinc-500">{semUnits} Units</span>
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
                            "flex flex-col gap-2 flex-1 overflow-y-auto pr-1 pb-2 min-h-[100px]",
                            snapshot.isDraggingOver &&
                                !isInvalidDropTarget &&
                                "shadow-xl opacity-90 ring-2 ring-white/50",
                            snapshot.isDraggingOver &&
                                isInvalidDropTarget &&
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
            <div className="mt-2 shrink-0">
                <button
                    onClick={() => setIsSearchOpen(true)}
                    className="flex items-center text-[#ff5c5c] hover:text-[#ff7878] text-[11px] font-semibold transition-colors cursor-pointer"
                >
                    <Plus className="h-3 w-3 mr-1" /> Add Courses
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
