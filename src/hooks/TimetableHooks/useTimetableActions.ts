import { useQueryClient } from "@tanstack/react-query";
import { getModule } from "@/services/nusmods";
import { addToTimetable, removeFromTimetable, addCustomEventToDB } from "@/services/timetableDB";
import { getCurrentAcadYear } from "@/utils/generalUtils/time";
import type { DisplayLesson } from "@/types";
import { timeToMins } from "@/utils/timetableUtils/timeFormat";
import { toast } from "sonner";

export function useTimetableActions(
    semester: number,
    selectedLesson: DisplayLesson | null,
    selectModuleToCompare: (lesson: DisplayLesson) => void,
    clearAlternatives: () => void,
    swapModuleSlot: (oldLesson: DisplayLesson, newLesson: DisplayLesson) => void
) {
    const queryClient = useQueryClient();
    const currentYear = getCurrentAcadYear();

    // Handle clicking selected class to show alternatives
    const handleSelectClass = (lesson: DisplayLesson) => {
        if (selectedLesson && selectedLesson.id === lesson.id) {
            clearAlternatives();
        } else {
            selectModuleToCompare(lesson);
        }
    };

    // Handle clicking alternatives to swap class
    const handleSwapClass = async (
        oldLesson: DisplayLesson | null,
        chosenAlternative: DisplayLesson
    ) => {
        if (!oldLesson) return;

        try {
            swapModuleSlot(oldLesson, chosenAlternative);
        } catch (err) {
            console.error("Failed to change class:", err);
        }
    };

    // Handle adding a module from SearchBar
    const handleAddModule = async (moduleCode: string, currentlyActive: any[] = []) => {
        
        // Ensure that module cannot be added twice (unless its a custom)
        const isDuplicate = currentlyActive.some((mod) => {
            const isCustom = mod?.id && typeof mod.id === "string" && mod.id.startsWith("custom-");
            if (isCustom) return false; 
            return mod?.moduleCode?.toUpperCase() === moduleCode.toUpperCase();
        });

        if (isDuplicate) {
            toast.error("Failed to Add Module", {
                description: `${moduleCode} is already added to your timetable!`,
            });
            return false; 
        }
                
        const module = await getModule(moduleCode);

        const semData = module?.semesterData?.find(
            (s) => s.semester === semester
        );

        if (!semData?.timetable) {
            toast.error("Failed to Add Module", {
                description: `Module is not available in ${semester}`,
            });
            alert(`Module not offered in Semester ${semester}`);
            return;
        }

        await addToTimetable(
            moduleCode,
            semData.timetable,
            currentYear,
            semester
        );

        await queryClient.invalidateQueries({
            queryKey: ["timetable", currentYear, semester],
        });
    };

    // Handle removing a module from Active Modules Container
    const handleRemoveModule = async (moduleCode: string, id?: string | number, lessonType?: string) => {
        if (!moduleCode) return;

        if (lessonType === "Personal Block" && id) {
            await removeFromTimetable(moduleCode, currentYear, semester, String(id));
        } else {
            await removeFromTimetable(moduleCode, currentYear, semester);
        }

        await queryClient.invalidateQueries({
            queryKey: ["timetable", currentYear, semester],
        });
    };


    // Handle addition of customized events
    const handleCustomEvent = async (eventData: {
            name: string;
            day: string;
            startTime: string;
            endTime: string;
            venue: string;
            selectedWeeks: number[];
            weekBitmask: number
            classNo: string;
        }) => {
        const newCustomCard: DisplayLesson = {
            id: `custom-${Date.now()}`,
            moduleCode: eventData.name.trim(),
            lessonType: "Personal Block",
            classNo: eventData.classNo,
            day: eventData.day,
            startTime: eventData.startTime, 
            endTime: eventData.endTime,     
            venue: eventData.venue.trim() || "No Venue Assigned",
            weeks: eventData.selectedWeeks, 
            weekBitmask: eventData.weekBitmask,           
            isAlternative: false,
            startMins: timeToMins(eventData.startTime),
            endMins: timeToMins(eventData.endTime)
        };

        const success = await addCustomEventToDB(newCustomCard, currentYear, semester);
        
        if (success) {
            await queryClient.invalidateQueries({
                queryKey: ["timetable", currentYear, semester],
            });
        }
    };

    return {
        handleSelectClass,
        handleSwapClass,
        handleAddModule,
        handleRemoveModule,
        handleCustomEvent
    };
}
