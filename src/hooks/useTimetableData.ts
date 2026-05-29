import { supabase } from "@/services/supabase";
import type { DisplayLesson, SavedTimetableModule } from "@/types"
import { getUserModules } from "@/services/timetableDB";
import { useEffect, useState } from "react";
import { getModule } from "@/services/nusmods";


export function useTimetableData(year:number, semester: number) {
    const [modules, setModules] = useState <DisplayLesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLesson, setSelectedLesson] = useState<DisplayLesson | null>(null);
    const [alternatives, setAlternatives] = useState<DisplayLesson[]>([]);


    //_____________________________retrieve and format selected lessons whenever year/sem changes_______________________________//
    useEffect(() => {
        async function loadModuleData() {
              try {
                setLoading(true);
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
    
                // Retrieve from Supabase firectly with a single call,
                // Removed need to call API again using tokens (old)
                const { myModules } = await getUserModules(user.id, year, semester);
                const savedList = (myModules as SavedTimetableModule[] || []);
                const compiledLessons: DisplayLesson[] = savedList.map(
                    (saved) => ({
                        id: saved.id,
                        moduleCode: saved.module_code,
                        lessonType: saved.lesson_type,
                        classNo: saved.class_no,
                        day: saved.day,
                        startTime: saved.start_time,
                        endTime: saved.end_time,
                        venue: saved.venue,
                        weeks: saved.weeks
                            ? JSON.parse(saved.weeks)
                            : null
                    })
                );

    
                
                // SET HERE + ERROR HANDLING
                setModules(compiledLessons);
                setSelectedLesson(null);
                setAlternatives([]);
            } catch (error) {
                console.error("Error: ", error);
            } finally {
                setLoading(false);
            }
          }
    
          loadModuleData();
        }, [year, semester]);


    //_____________________________fn to retrieve and format alternative lessons__________________________________//
    const selectModuleToCompare = async (lesson: DisplayLesson) => {
        setSelectedLesson(lesson);

        try {
            // Get alternative class mod data from NUSAPI since Supabase only stores personal selection
            const modData = await getModule(lesson.moduleCode);
            
            if (!modData) throw new Error("Invalid module code");

            // Find the timetable array for semester
            const semData = modData.semesterData?.find((s: any) => s.semester === semester);
            const rawTimetable = semData?.timetable || [];

            // filter out alternatives
            const alternativesFiltered = rawTimetable.filter((slot: any) => {
            const apiLessonType = (slot.lessonType || "").toUpperCase();
            const currentLessonType = (lesson.lessonType || "").toUpperCase();
            const apiClassNo = String(slot.classNo || slot.class_no || "").replace(/^0+/, "");
            const currentClassNo = String(lesson.classNo || "").replace(/^0+/, ""); 
            return apiLessonType === currentLessonType && apiClassNo !== currentClassNo;
            });

            // format into display lesson
            const mappedAlternatives: DisplayLesson[] = alternativesFiltered.map((alt: any, index: number) => {
                const finalClassNo = alt.classNo || alt.class_no || "";

                return {
                    id: `alt-${lesson.moduleCode}-${alt.lessonType}-${finalClassNo}-${index}`,
                    moduleCode: lesson.moduleCode,
                    lessonType: alt.lessonType, 
                    classNo: finalClassNo, 
                    day: alt.day,
                    startTime: alt.startTime,
                    endTime: alt.endTime,
                    venue: alt.venue || "No Venue",
                    weeks: alt.weeks,
                    isAlternative: true
                };
            });

            setAlternatives(mappedAlternatives);
        } catch (error) {
            console.error("Failed to fetch alternative:", error);
            setAlternatives([]);
        }
    };
    //___________________________________ fn to clear current alternatives___________________________________________//
    const clearAlternatives = () => {
        setSelectedLesson(null);
        setAlternatives([]);
        };

    //______________________________________ fn to swap to alternative__________________________________________//
    const swapModuleSlot = async (oldLessonId: string, newLessonData: DisplayLesson) => {
        // recreate a fresh array with unmodified previously selected mods. Only modify the alt (same old id)
        // with newLessonData info and set isAlt to false.
        setModules((prevModules) =>
            prevModules.map((mod) =>
                mod.id === oldLessonId 
                    ? { 
                        ...mod, 
                        classNo: newLessonData.classNo,
                        day: newLessonData.day,
                        startTime: newLessonData.startTime,
                        endTime: newLessonData.endTime,
                        venue: newLessonData.venue,
                        weeks: newLessonData.weeks,
                        isAlternative: false 
                    } 
                    : mod
            )
        );

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No authenticated user found");

            // update Supabase to use this new alternative as currently selected mod
            const { error } = await supabase
                .from("timetable_modules") 
                .update({
                    class_no: newLessonData.classNo,
                    day: newLessonData.day,
                    start_time: newLessonData.startTime,
                    end_time: newLessonData.endTime,
                    venue: newLessonData.venue,
                    weeks: JSON.stringify(newLessonData.weeks)
                })
                .eq("id", oldLessonId)
                .eq("user_id", user.id)
                // .select(); for DEBUGGING (update RLS)

            if (error) throw error;

        } catch (error) {
            console.error("Failed to update Supabase:", error);
            
        } finally {
            // always clear alternatives so rerender does not show blocks again
            setSelectedLesson(null);
            setAlternatives([]);
        }
    };

    
    

    return { 
        modules, 
        loading, 
        selectedLesson, 
        alternatives, 
        selectModuleToCompare, 
        clearAlternatives,
        swapModuleSlot
    };
}