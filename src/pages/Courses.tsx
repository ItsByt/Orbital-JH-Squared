import AutocompleteSearch from "@/components/AutoCompleteSearch";
import { useState } from "react";
import { getModule } from "@/services/nusmods";
import type { ModuleDetails } from "@/services/nusmods";
import { Loader2 } from "lucide-react";
import {supabase} from "@/services/supabase";
import { toast } from "sonner";

async function addToTimetable(moduleCode: string, 
    timetableSlots: ModuleDetails["semesterData"][number]["timetable"]) {

    try {
        // Get user (supabase). Add to timetable only works if logged in
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            toast.error("Authentication required. Please log in first.");
            return;
        }

        // For each timetable "block", group by type, add to Record 
        // Create type if encountered new category
        const groupBy: Record<string, ModuleDetails["semesterData"][number]["timetable"]> = {};
        timetableSlots.forEach(slot => {
            if (!groupBy[slot.lessonType]) {
                groupBy[slot.lessonType] = [];
            }
            groupBy[slot.lessonType].push(slot);
        });

        const rowsToInsert = [];
        // parse every timetable type and retrieve earliest class
        // then update details into supabase
        for (const lessonType in groupBy) {
            const slots = groupBy[lessonType];
            slots.sort((a, b) => {
                if (a.classNo != b.classNo)
                    return a.classNo.localeCompare(b.classNo);
                return parseInt(a.startTime) - parseInt(b.startTime);
            });

            const earliest = slots[0];
            rowsToInsert.push({
                user_id: user.id,
                module_code: moduleCode,
                lesson_type: lessonType,
                class_no: earliest.classNo,
                year: 2025,
                semester: 2
            });
        }

        const { error: dbError} = await supabase
                    .from("timetable_modules")
                    .upsert(rowsToInsert);
        if (dbError) throw dbError;

        toast.success('${moduleCode} has been successfully added!', {
            description: "Please Check your Timetable"});
    } catch (error:any) {
        toast.error("Failed to update timetable database.", {
            description: error.message || "Unexpected error occurred."
        });
    }
}


export default function Courses() {
    // Initialize variable with state to store description state (or null)
    // Initialize state boolean for fetching status similar to loading
    const [selectedModule, setSelectedModule] = useState<ModuleDetails | null >(null);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);

    // Handle Selection logic
    const handleModuleSelect = async (moduleCode: string) => {
        setIsFetchingDetails(true);
        // reset previous selection
        setSelectedModule(null);

        const desc = await getModule(moduleCode);
        setSelectedModule(desc);
        setIsFetchingDetails(false);

    };

    return (
        <div className="space-y-6">

            <div>
                <h1 className="text-3xl font-bold">Courses</h1>
                <p className="text-gray-500">Search for modules to add to your timetable.</p>
            </div>

            {/* Run autocomplete, on select call async function to show desc*/}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <AutocompleteSearch onSelect={handleModuleSelect} />
            </div>

            {/* Fetch loading */}
            {isFetchingDetails && (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            )}

            {/* // Render description once details ready (not null) */}
            {selectedModule && (
    <div className="p-6 bg-white border rounded-xl shadow-sm space-y-4 text-sm text-gray-600 leading-relaxed">
        
        {/* Header Block */}
        <div className="flex justify-between items-start border-b pb-3">
            <div>
                <span className="font-bold text-blue-600 tracking-wide">{selectedModule.moduleCode}</span>
                <h2 className="text-xl font-bold text-gray-900 mt-0.5">{selectedModule.title}</h2>
            </div>
            <span className="font-semibold text-gray-800 shrink-0">{selectedModule.moduleCredit} MCs</span>
        </div>
        {/* ADD TO TIMETABLE button */}
                <button 
                    onClick={() => {
                        // Find Semester 2 data out of the array
                        const sem2Data = selectedModule.semesterData?.find(s => s.semester === 2);
                        if (sem2Data && sem2Data.timetable) {
                            addToTimetable(selectedModule.moduleCode, sem2Data.timetable);
                        } else {
                            alert("This module is not offered in Semester 2.");
                        }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition"
                >
                    Add to Timetable
                </button>

        {/* Description */}
        <p>{selectedModule.description || "No description provided for this module."}</p>
        
    </div>
)}

        </div>
    );
}
