import { getCurrentAcadYear } from "@/utils/time"; 
import { useState, useEffect } from "react";
import type { ModuleDetails } from "@/types";
import { addToTimetable, removeFromTimetable, isInTimetable } from "@/services/timetableDB";
import { Loader2 } from "lucide-react";

export default function ModuleDetailsCard({ module }: { module: ModuleDetails }) {
    const [isAddedSem1, setIsAddedSem1] = useState(false);
    const [isProcessingSem1, setIsProcessingSem1] = useState(false);
    const [isAddedSem2, setIsAddedSem2] = useState(false);
    const [isProcessingSem2, setIsProcessingSem2] = useState(false);

    const currentYear = getCurrentAcadYear();

    useEffect(() => {
        async function checkStatus() {
            const savedSem1 = await isInTimetable(module.moduleCode, currentYear, 1);
            const savedSem2 = await isInTimetable(module.moduleCode, currentYear, 2);
            setIsAddedSem1(savedSem1);
            setIsAddedSem2(savedSem2);
        }
        checkStatus();
    }, [module.moduleCode, currentYear]);

    const handleToggle = async (semester: number) => {
        const semData = module.semesterData?.find(s => s.semester === semester);
        if (!semData || !semData.timetable) {
            alert(`This module is not offered in Semester ${semester}.`);
            return;
        }

        const isAdded = semester === 1 ? isAddedSem1 : isAddedSem2;
        const setProcessing = semester === 1 ? setIsProcessingSem1 : setIsProcessingSem2;
        const setAdded = semester === 1 ? setIsAddedSem1 : setIsAddedSem2;

        setProcessing(true);

        if (isAdded) {
            const success = await removeFromTimetable(module.moduleCode, currentYear, semester);
            if (success) setAdded(false);
        } else {
            await addToTimetable(module.moduleCode, semData.timetable, currentYear, semester);
            setAdded(true);
        }

        setProcessing(false);
    };

    const offeredSem1 = module.semesterData?.some(s => s.semester === 1);
    const offeredSem2 = module.semesterData?.some(s => s.semester === 2);

    return (
        <div className="p-6 bg-card border border-border rounded-xl shadow-sm space-y-4 text-sm text-muted-foreground leading-relaxed transition-colors duration-200">
            
            {/* Header section wrapper */}
            <div className="flex justify-between items-start border-b border-border pb-3">
                <div>
                    <span className="font-bold text-foreground tracking-wide">{module.moduleCode}</span>
                    <h2 className="text-xl font-bold text-foreground mt-0.5">{module.title}</h2>
                </div>
                <span className="font-semibold text-foreground shrink-0">{module.moduleCredit} MCs</span>
            </div>

            {/* Semester Action Buttons */}
            <div className="flex gap-2">
                {offeredSem1 && (
                    <button
                        onClick={() => handleToggle(1)}
                        disabled={isProcessingSem1}
                        className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-white transition cursor-pointer
                            ${isAddedSem1 ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                        {isProcessingSem1 && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        {isAddedSem1 ? "Remove from Sem 1" : "Add to Sem 1"}
                    </button>
                )}

                {offeredSem2 && (
                    <button
                        onClick={() => handleToggle(2)}
                        disabled={isProcessingSem2}
                        className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-white transition cursor-pointer
                            ${isAddedSem2 ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                        {isProcessingSem2 && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        {isAddedSem2 ? "Remove from Sem 2" : "Add to Sem 2"}
                    </button>
                )}
            </div>

            {/* Module Description Paragraph */}
            <p className="text-sm text-muted-foreground leading-relaxed">
                {module.description || "No description provided for this module."}
            </p>
        </div>
    );
}