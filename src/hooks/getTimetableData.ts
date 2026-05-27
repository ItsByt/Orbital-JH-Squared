import { supabase } from "@/services/supabase";
import type { ModuleDetails, DisplayLesson, SavedTimetableModule } from "@/types"
import { getUserModules } from "@/services/timetableDB";
import { getModule } from "@/services/nusmods";
import { useEffect, useState } from "react";


export function getTimetableData(year:number, semester: number) {
    const [modules, setModules] = useState <DisplayLesson[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadModuleData() {
              try {
                setLoading(true);
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
    
                // Retrieve user added mod classes from Supabase and format
                // Only contains important tokens, no details yet.
                const { myModules } = await getUserModules(user.id, year, semester);
                const savedList = (myModules as SavedTimetableModule[] || []);
                const compiledLessons: DisplayLesson[] = [];
    
    
                // Fetch global module scheduling data from NUSMods, 
                // and filter out non-matching class sections
                for (const saved of savedList) {
                        const details: ModuleDetails | null = await getModule(saved.module_code);
                        if (!details) continue;
                        const semData = details.semesterData?.find(s => s.semester === semester);
                        
                        if (semData?.timetable) {
                            const matchedSlots = semData.timetable.filter(
                                slot => slot.lessonType.toLowerCase() === saved.lesson_type.toLowerCase() && 
                                        slot.classNo === saved.class_no
                            );
    
                            // Push all matching classes user selected
                            // into compiledLessons array, which
                            // formats to match UI block interface
                            matchedSlots.forEach(slot => {
                                compiledLessons.push({
                                    id: `${saved.id}-${slot.day}-${slot.startTime}`,
                                    moduleCode: saved.module_code,
                                    lessonType: saved.lesson_type,
                                    classNo: saved.class_no,
                                    day: slot.day,
                                    startTime: slot.startTime,
                                    endTime: slot.endTime,
                                    venue: slot.venue,
                                    weeks: slot.weeks
                                });
                            });
                        }
                    }
    
                // SET HERE + ERROR HANDLING
                setModules(compiledLessons);
            } catch (error) {
                console.error("Error: ", error);
            } finally {
                setLoading(false);
            }
          }
    
          loadModuleData();
        }, [year, semester]);

    return { modules, loading };
}