import { useState } from "react";
import { Plus } from "lucide-react";
import { usePlannerStore } from "@/store/usePlannerStore";
import ModuleBlock from "./ModuleBlock";
import AddCourseModal from "./AddCourseModal";

interface SemesterColumnProps {
    title: string; //Format: Semester 1
    semesterKey: string;
}

export default function SemesterColumn({ title, semesterKey }: SemesterColumnProps) {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const rawModules = usePlannerStore((state) => state.board[semesterKey]);
    const modules = rawModules || [];
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
            <div className="flex flex-col gap-2 flex-1 mb-4">
                {modules.map((mod) => (
                    <ModuleBlock key={mod.moduleCode} module={mod} semesterKey={semesterKey} />
                ))}
            </div>

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
