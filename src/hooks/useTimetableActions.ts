import { useQueryClient } from "@tanstack/react-query";
import { getModule } from "@/services/nusmods";
import { addToTimetable, removeFromTimetable } from "@/services/timetableDB";
import { getCurrentAcadYear } from "@/utils/generalUtils/time";
import type { DisplayLesson } from "@/types";

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
    const handleAddModule = async (moduleCode: string) => {
        const module = await getModule(moduleCode);

        const semData = module?.semesterData?.find(
            (s) => s.semester === semester
        );

        if (!semData?.timetable) {
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
    const handleRemoveModule = async (moduleCode: string) => {
        await removeFromTimetable(moduleCode, currentYear, semester);
        queryClient.invalidateQueries({queryKey: ["timetable", currentYear, semester],});
    }; 

    return {
        handleSelectClass,
        handleSwapClass,
        handleAddModule,
        handleRemoveModule,
    };
}