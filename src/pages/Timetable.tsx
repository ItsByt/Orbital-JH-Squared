import { supabase } from "@/services/supabase";
import { getUserModules } from "@/services/timetableDB";
import { getModule } from "@/services/nusmods";
import type { ModuleDetails } from "@/services/nusmods";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

// Data template from Supabase to use
interface SavedTimetableModule {
  id: string;
  module_code: string;
  lesson_type: string;
  class_no: string;
}
// Internal interface details for class BLOCKS 
interface DisplayLesson {
    id: string;
    moduleCode: string;
    lessonType: string;
    classNo: string;
    day: string;
    startTime: string;
    endTime: string;
    venue: string;
    weeks: number[] | string[];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const HOURS = ["0800", "0900", "1000", "1100", "1200", "1300", "1400", "1500", "1600", "1700"];



export default function Home() {
    const [modules, setModules] = useState<DisplayLesson[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadPageData() {
          try {
            setLoading(true);
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;
            if (!user) {
                alert("Please log in to add modules to your timetable!");
                return;
            }

            // Retrieve user added mod classes from Supabase and format
            // Only contains important tokens, no details yet.
            const { myModules } = await getUserModules(user.id);
            const savedList = (myModules as SavedTimetableModule[] || []);
            const compiledLessons: DisplayLesson[] = [];


            // Fetch global module scheduling data from NUSMods, 
            // extract Semester 2, and filter out non-matching class sections
            for (const saved of savedList) {
                    const details: ModuleDetails | null = await getModule(saved.module_code);
                    if (!details) continue;
                    const sem2Data = details?.semesterData?.find(s => s.semester === 2);
                    
                    if (sem2Data?.timetable) {
                        const matchedSlots = sem2Data.timetable.filter(
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

      loadPageData();
    }, []);
    
    // Helper for time conversion
    const convertTimeToColumn = (timeString: string) => {
        const hour = parseInt(timeString.substring(0, 2), 10);
        const minute = parseInt(timeString.substring(2, 4), 10);
        // Base starting point is 08:00 AM (Column 1)
        const baseHour = 8; 
        const hourDiff = hour - baseHour;
        const minuteFraction = minute / 60;
        return 1 + hourDiff * 2 + Math.floor(minuteFraction * 2); 
    };

    // Loading
    if (loading) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-50">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <span className="ml-3 text-lg font-medium text-slate-700">Checking session...</span>
        </div>
    );
  }

    return (
        <div className="p-6 bg-slate-50 min-h-screen text-slate-900">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">Semester 2 Timetable</h1>
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                
                {/* Header */}
                <div className="grid grid-cols-[80px_repeat(22,1fr)] border-b border-slate-200 text-center text-xs font-semibold text-slate-500 select-none bg-slate-100">
                    <div className="p-3 border-r border-slate-200 text-left text-slate-700 font-bold">Day</div>
                    {HOURS.map((hour) => (
                        <div key={hour} className="p-3 col-span-2 text-left pl-2 border-r border-slate-200/60">
                            {hour}
                        </div>
                    ))}
                </div>

                {/* Contents */}
                <div className="divide-y divide-slate-200">
                {DAYS.map((day) => {
                    const dayLessons = modules.filter(l => l.day.toLowerCase() === day.toLowerCase());

                    return (
                    <div key={day} className="grid grid-cols-[80px_repeat(22,1fr)] min-h-28 relative group">
                        
                        {/* Day Label (Spans 1 column, rows 1) */}
                        <div className="flex items-center justify-center font-bold text-xs text-slate-700 border-r border-slate-200 bg-slate-50 uppercase tracking-wider select-none z-10 grid-row-start-1">
                        {day.substring(0, 3)}
                        </div>

                        {/* BACKGROUND GRID */}
                        {Array.from({ length: 22 }).map((_, i) => (
                        <div 
                            key={i} 
                            style={{
                            gridColumnStart: i + 2, 
                            gridRowStart: 1
                            }}
                            className={`h-full border-r border-slate-100 min-h-[112px] ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`} 
                        />
                        ))}

                        {/* 2. MODULAR BLOCKS */}
                        {dayLessons.map((lesson) => {
                        const colStart = convertTimeToColumn(lesson.startTime);
                        const colEnd = convertTimeToColumn(lesson.endTime);

                        return (
                            <div
                            key={lesson.id}
                            style={{
                                gridColumnStart: colStart + 1, 
                                gridColumnEnd: colEnd + 1,
                                gridRowStart: 1,
                            }}
                            className="my-1 mx-0.5 p-2 bg-purple-100 border border-purple-300 rounded shadow-sm text-xs flex flex-col justify-between overflow-hidden cursor-pointer hover:bg-purple-200 transition-all z-20"
                            >
                            <div>
                                <div className="font-bold text-purple-900 truncate">
                                {lesson.moduleCode}
                                </div>
                                <div className="text-[10px] text-purple-700 font-semibold mt-0.5">
                                {lesson.lessonType.substring(0, 3).toUpperCase()} [{lesson.classNo}]
                                </div>
                                <div className="text-[10px] text-slate-600 mt-0.5 font-medium truncate">
                                {lesson.venue}
                                </div>
                            </div>
                            
                            {lesson.weeks && (
                                <div className="text-[9px] text-slate-400 mt-1 font-medium">
                                Weeks {typeof lesson.weeks === 'string' ? lesson.weeks : '3-13'}
                                </div>
                            )}
                            </div>
                        );
                        })}
                    </div>
                    );
                })}
                </div>
            </div>
        </div>
    );
}











