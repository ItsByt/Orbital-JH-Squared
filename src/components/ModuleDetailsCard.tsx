import { useState, useEffect } from "react";
import type { ModuleDetails } from "@/services/nusmods";
import { addToTimetable, removeFromTimetable, isInTimetable } from "@/services/timetableDB";
import { Loader2 } from "lucide-react";

export default function ModuleDetailsCard({ module }: { module: ModuleDetails }) {
    // Initialize variable with state to store description state (or null)
    // Initialize state boolean for fetching status similar to loading
    const [isAdded, setIsAdded] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        async function checkStatus() {
            const saved = await isInTimetable(module.moduleCode, 2025, 2);
            setIsAdded(saved);
        }
        checkStatus();
    }, [module.moduleCode]);

    const handleToggleTimetable = async () => {
        const sem2Data = module.semesterData?.find(s => s.semester === 2);

        if (!sem2Data || !sem2Data.timetable) {
            alert("This module is not offered in Semester 2.");
            return;
        }

        setIsProcessing(true);

        if (isAdded) {
            const success = await removeFromTimetable(module.moduleCode, 2025, 2);
            if (success) setIsAdded(false);
        } else { //If it has not been added
            await addToTimetable(module.moduleCode, sem2Data.timetable);
            setIsAdded(true);
        }

        setIsProcessing(false);
    };

    return (
        <div className="p-6 bg-white border rounded-xl shadow-sm space-y-4 text-sm text-gray-600 leading-relaxed">
            <div className="flex justify-between items-start border-b pb-3">
                <div>
                    <span className="font-bold text-blue-600 tracking-wide">{module.moduleCode}</span>
                    <h2 className="text-xl font-bold text-gray-900 mt-0.5">{module.title}</h2>
                </div>
                <span className="font-semibold text-gray-800 shrink-0">{module.moduleCredit} MCs</span>
            </div>

            {/* THE SMART TOGGLE BUTTON */}
            <button
                onClick={handleToggleTimetable}
                disabled={isProcessing} // Lock button while loading
                className={`flex items-center font-medium px-3 py-1.5 rounded-lg text-xs transition text-white
                    ${isAdded ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}
                    ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                {/* Show a tiny spinner if processing, otherwise show the text */}
                {isProcessing && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                {isAdded ? "Remove from Timetable" : "Add to Timetable"}
            </button>

            <p>{module.description || "No description provided for this module."}</p>
        </div>
    );
}
