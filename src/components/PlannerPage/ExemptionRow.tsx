import { useState } from "react";
import { Plus } from "lucide-react";
import { Droppable } from "@hello-pangea/dnd";
import { usePlannerStore } from "@/store/usePlannerStore";
import ModuleBlock from "./ModuleBlock";
import AddCourseModal from "./AddCourseModal";

export default function ExemptionRow() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const rawModules = usePlannerStore((state) => state.board["EXEMPTIONS"]);
    const modules = rawModules || [];

    // For counting modules and units that are included
    const includedModules = modules.filter((mod) => !mod.excludeFromTotal);
    const exemptionUnits = includedModules.reduce((sum, mod) => sum + mod.moduleCredit, 0);
    const exemptionCount = includedModules.length;

    return (
        <div className="shrink-0 border-t border-zinc-800 pt-3 px-6 pb-3">
            <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-zinc-300 text-[11px] uppercase tracking-wider">
                    Exemptions
                </h3>
                {exemptionCount > 0 && (
                    <span className="text-[10px] text-zinc-500">
                        {exemptionCount} Courses / {exemptionUnits} Units
                    </span>
                )}
            </div>

            {/* The Row of Cards */}
            <Droppable droppableId="EXEMPTIONS" direction="horizontal">
                {/* Draggable snapshot properties -> isDraggingOver, draggingOverWith */}
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef} //attaches the DOM node
                        {...provided.droppableProps} //props needed for DnD
                        className={`flex flex-row flex-wrap gap-2 min-h-[70px] p-2 rounded-md border border-dashed
                            ${snapshot.isDraggingOver ? "border-zinc-500 bg-zinc-800/30" : "border-zinc-700"}
                        `}
                    >
                        {modules.map((mod, index) => (
                            <ModuleBlock
                                key={mod.moduleCode}
                                module={mod}
                                semesterKey="EXEMPTIONS"
                                index={index}
                            />
                        ))}
                        {provided.placeholder}
                        {/* Required by DnD to increase the space during a drag when needed*/}
                    </div>
                )}
            </Droppable>

            {/* Adding Courses*/}
            <div className="mt-2">
                <button
                    onClick={() => setIsSearchOpen(true)}
                    className="flex items-center text-[#ff5c5c] hover:text-[#ff7878] text-[11px] font-semibold transition-colors cursor-pointer"
                >
                    <Plus className="h-3 w-3 mr-1" /> Add Exemption
                </button>
            </div>

            {/* Search Modal */}
            <AddCourseModal
                open={isSearchOpen}
                onOpenChange={setIsSearchOpen}
                semesterKey="EXEMPTIONS"
            />
        </div>
    );
}
