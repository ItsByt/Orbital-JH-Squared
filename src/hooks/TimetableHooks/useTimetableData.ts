import { getUserId } from "@/services/auth";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserModules, swapLessonInTimetableDB } from "@/services/timetableDB";
import { getModule } from "@/services/nusmods";
import type { DisplayLesson, ModuleDetails, NUSModsRawLesson, SavedTimetableModule } from "@/types";
import {
    formatSavedTimetableModules,
    formatAlternativeLessons,
    buildDisplayLesson,
} from "@/utils/timetableUtils/lessonFormatters";

export function useTimetableData(year: number, semester: number) {
    const queryClient = useQueryClient();
    const queryKey = ["timetable", year, semester];

    const { data: modules = [], isLoading: loading } = useQuery({
        queryKey,
        queryFn: async () => {
            const userId = await getUserId();
            if (!userId) return [];
            const { myModules } = await getUserModules(userId, year, semester);
            const savedList = (myModules as SavedTimetableModule[]) || [];
            const compiledLessons: DisplayLesson[] = formatSavedTimetableModules(savedList);
            return compiledLessons;
        },
        staleTime: 1000 * 60 * 5, //Cache time of 5 minutes
    });

    const [selectedLesson, setSelectedLesson] = useState<DisplayLesson | null>(null);

    const { data: modData } = useQuery<ModuleDetails | null>({
        queryKey: ["nusmods", selectedLesson?.moduleCode],
        queryFn: () => getModule(selectedLesson!.moduleCode),
        enabled: !!selectedLesson, // Only fetch when a lesson is selected
        staleTime: Infinity, // NUSMods data does not change during a session
    });

    //_____________________________fn to retrieve and format alternative lessons__________________________________//
    const alternatives = useMemo(() => {
        if (!selectedLesson || !modData) return [];
        const semData = modData.semesterData?.find((s) => s.semester === semester);
        const rawTimetable = semData?.timetable || [];
        return formatAlternativeLessons(rawTimetable, selectedLesson);
    }, [selectedLesson, modData, semester]);

    //___________________________________ fn to clear current alternatives___________________________________________//
    const clearAlternatives = () => setSelectedLesson(null);

    //______________________________________ fn to swap to alternative__________________________________________//
    const swapMutation = useMutation({
        mutationFn: async ({
            oldLesson,
            newClassSlots,
        }: {
            oldLesson: DisplayLesson;
            newClassSlots: DisplayLesson[];
        }) => {
            await swapLessonInTimetableDB(oldLesson, newClassSlots, year, semester);
        },
        onMutate: async ({ oldLesson, newClassSlots }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey });

            // Snapshot previous value for rollback
            const previousModules = queryClient.getQueryData<DisplayLesson[]>(queryKey);

            // Optimistically update UI
            queryClient.setQueryData<DisplayLesson[]>(queryKey, (old) => {
                if (!old) return [];

                const filteredOld = old.filter(
                    (mod) =>
                        !(
                            mod.moduleCode === oldLesson.moduleCode &&
                            mod.lessonType === oldLesson.lessonType &&
                            mod.classNo === oldLesson.classNo
                        )
                );

                return [...filteredOld, ...newClassSlots];
            });

            clearAlternatives();
            return { previousModules };
        },

        onError: (err, _variables, context) => {
            console.error("Supabase failed, rolling back. The error was:", err);
            if (context?.previousModules) {
                queryClient.setQueryData(queryKey, context.previousModules);
            }
        },
        onSettled: () => {
            // Sync with server completely when done
            queryClient.invalidateQueries({ queryKey });
        },
    });

    return {
        modules,
        loading,
        selectedLesson,
        alternatives,
        selectModuleToCompare: setSelectedLesson,
        clearAlternatives,
        swapModuleSlot: (oldLesson: DisplayLesson, newLesson: DisplayLesson) => {
            if (!modData) return;

            const semData = modData.semesterData?.find((s) => s.semester === semester);
            const rawTimetable = semData?.timetable || [];

            // Find every lesson block that shares this new classNo
            const tiedRawSlots = rawTimetable.filter(
                (slot: NUSModsRawLesson) =>
                    (slot.lessonType || "").toUpperCase() === newLesson.lessonType.toUpperCase() &&
                    slot.classNo === newLesson.classNo
            );

            const newClassSlots: DisplayLesson[] = tiedRawSlots.map(
                (slot: NUSModsRawLesson, index: number) =>
                    buildDisplayLesson(oldLesson.moduleCode, slot, `temp-swap-${index}`, false)
            );

            swapMutation.mutate({ oldLesson, newClassSlots });
        },
    };
}
