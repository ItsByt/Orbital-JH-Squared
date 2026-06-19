import { useQueryClient } from "@tanstack/react-query";
import { getModule } from "@/services/nusmods";
import { addToTimetable, removeFromTimetable, addCustomEventToDB } from "@/services/timetableDB";
import { getCurrentAcadYear } from "@/utils/generalUtils/time";
import { getErrorMessage } from "@/utils/generalUtils/getErrorMessage";
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
        } catch (error) {
            toast.error("Failed to swap class", { description: getErrorMessage(error) });
        }
    };

    // Handle adding a module from SearchBar
    const handleAddModule = async (
        moduleCode: string,
        currentlyActive: DisplayLesson[] = []
    ): Promise<void> => {
        try {
            // Ensure that module cannot be added twice (unless its a custom)
            const isDuplicate = currentlyActive.some((mod) => {
                const isCustom = typeof mod.id === "string" && mod.id.startsWith("custom-");
                if (isCustom) return false;
                return mod.moduleCode.toUpperCase() === moduleCode.toUpperCase();
            });

            if (isDuplicate) {
                throw new Error(`${moduleCode} is already in your timetable!`);
            }

            const module = await getModule(moduleCode);
            const semData = module?.semesterData?.find((s) => s.semester === semester);

            if (!semData?.timetable) {
                throw new Error(`Module is not offered in Semester ${semester}`);
            }

            // If valid, add to Timetable Database
            await addToTimetable(moduleCode, semData.timetable, currentYear, semester);

            await queryClient.invalidateQueries({
                queryKey: ["timetable", currentYear, semester],
            });

            toast.success(`${moduleCode} successfully added!`);
        } catch (error) {
            toast.error("Failed to add module", { description: getErrorMessage(error) });
        }
    };

    // Handle removing a module from Active Modules Container
    const handleRemoveModule = async (
        moduleCode: string,
        id?: string | number,
        lessonType?: string
    ) => {
        if (!moduleCode) return;

        try {
            if (lessonType === "Personal Block" && id) {
                await removeFromTimetable(moduleCode, currentYear, semester, String(id));
            } else {
                await removeFromTimetable(moduleCode, currentYear, semester);
            }

            await queryClient.invalidateQueries({
                queryKey: ["timetable", currentYear, semester],
            });

            toast.success(`${moduleCode} removed from your timetable.`);
        } catch (error) {
            toast.error("Failed to remove module", { description: getErrorMessage(error) });
        }
    };

    // Handle addition of customized events
    const handleCustomEvent = async (eventData: {
        name: string;
        day: string;
        startTime: string;
        endTime: string;
        venue: string;
        selectedWeeks: number[];
        weekBitmask: number;
        classNo: string;
    }) => {
        try {
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
                endMins: timeToMins(eventData.endTime),
            };

            await addCustomEventToDB(newCustomCard, currentYear, semester);

            await queryClient.invalidateQueries({
                queryKey: ["timetable", currentYear, semester],
            });

            toast.success(`Custom event "${newCustomCard.moduleCode}" added!`);
        } catch (error) {
            toast.error("Failed to save custom event", { description: getErrorMessage(error) });
        }
    };

    return {
        handleSelectClass,
        handleSwapClass,
        handleAddModule,
        handleRemoveModule,
        handleCustomEvent,
    };
}
