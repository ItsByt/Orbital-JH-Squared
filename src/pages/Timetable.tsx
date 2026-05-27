import { getTimetableData } from "@/hooks/getTimetableData";
import { getCurrentAcadYear, getAcadYearString } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const HOURS = ["0800", "0900", "1000", "1100", "1200", "1300", "1400", "1500", "1600", "1700"];

export default function TimetablePage({ semester }: { semester: number }) {
    const currentYear: number = getCurrentAcadYear();
    const acadYearString: String = getAcadYearString();
    const { modules, loading } = getTimetableData(currentYear, semester);
    const navigate = useNavigate();
    
    // Helper for time conversion
    const convertTimeToColumn = (timeString: string) => {
        const hour = parseInt(timeString.substring(0, 2), 10);
        const minute = parseInt(timeString.substring(2, 4), 10);
        const baseHour = 8; 
        const hourDiff = hour - baseHour;
        const minuteFraction = minute / 60;
        return 1 + hourDiff * 2 + Math.floor(minuteFraction * 2); 
    };

    // Loading 
    if (loading) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground transition-colors duration-200">
                <Loader2 className="h-10 w-10 animate-spin text-[#749c83]" />
                <span className="ml-3 mt-4 text-base font-medium text-muted-foreground">Loading timetable data...</span>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen flex flex-col items-start justify-start pt-1 px-6 pb-6 space-y-4 bg-background text-foreground transition-colors duration-200">
            
            <h1 className="text-4xl font-bold"
                style={{
                fontFamily: "Bahnschrift, sans-serif",
                color: "#56A58B"}}>
                {acadYearString} Semester {semester} Timetable
            </h1>

            {/* Timetable Grid Container  */}
            <div className="w-full border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                
                {/* Header Row */}
                <div className="grid grid-cols-[80px_repeat(22,1fr)] border-b border-border text-center text-xs font-semibold text-muted-foreground select-none bg-muted/50">
                    <div className="p-3 border-r border-border text-left text-foreground font-bold">Day</div>
                    {HOURS.map((hour) => (
                        <div key={hour} className="p-3 col-span-2 text-left pl-2 border-r border-border/40">
                            {hour}
                        </div>
                    ))}
                </div>

                {/* Grid Contents */}
                <div className="divide-y divide-border">
                {DAYS.map((day) => {
                    const dayLessons = modules.filter(l => l.day.toLowerCase() === day.toLowerCase());

                    return (
                    <div key={day} className="grid grid-cols-[80px_repeat(22,1fr)] min-h-28 relative group">
                        
                        {/* Left Side Day Label column */}
                        <div className="flex items-center justify-center font-bold text-xs text-muted-foreground border-r border-border bg-muted/30 uppercase tracking-wider select-none z-10 grid-row-start-1">
                            {day.substring(0, 3)}
                        </div>

                        {/* BACKGROUND GRID MATRIX CELLS */}
                        {Array.from({ length: 22 }).map((_, i) => (
                        <div 
                            key={i} 
                            style={{
                                gridColumnStart: i + 2, 
                                gridRowStart: 1
                            }}
                            className={`h-full border-r border-border/20 min-h-[112px] ${i % 2 === 1 ? 'bg-muted/10' : ''}`} 
                        />
                        ))}

                        {/* 2. TIMETABLE LESSON CELL BLOCKS */}
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

                                className="my-1 mx-0.5 p-2 bg-purple-500/10 dark:bg-purple-500/20 border border-purple-400/40 dark:border-purple-400/30 rounded shadow-sm text-xs flex flex-col justify-between overflow-hidden cursor-pointer hover:bg-purple-500/20 dark:hover:bg-purple-500/30 transition-all duration-200 z-20"
                            >
                                <div>
                                    <div className="font-bold text-purple-600 dark:text-purple-300 truncate">
                                        {lesson.moduleCode}
                                    </div>
                                    <div className="text-[10px] text-purple-500 dark:text-purple-400 font-semibold mt-0.5">
                                        {lesson.lessonType.substring(0, 3).toUpperCase()} [{lesson.classNo}]
                                    </div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5 font-medium truncate">
                                        {lesson.venue}
                                    </div>
                                </div>
                                
                                {lesson.weeks && (
                                    <div className="text-[9px] text-muted-foreground/60 mt-1 font-medium">
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
            {/* Semester Navigation Buttons */}
                    <div className="w-full flex justify-start items-center gap-2 pt-2">
                        {/* Semester 1  */}
                        <Button
                            variant={semester === 1 ? "default" : "outline"}
                            onClick={() => navigate("/timetable/sem-1")}
                            className={`h-9 px-4 text-xs font-medium transition-all duration-200 cursor-pointer ${
                                semester === 1 
                                ? "bg-[#749c83] text-white hover:bg-[#638570]" 
                                : "border-border text-foreground hover:bg-muted"
                            }`}
                        >
                            Semester 1
                        </Button>

                        {/* Semester 2  */}
                        <Button
                            variant={semester === 2 ? "default" : "outline"}
                            onClick={() => navigate("/timetable/sem-2")}
                            className={`h-9 px-4 text-xs font-medium transition-all duration-200 cursor-pointer ${
                                semester === 2 
                                ? "bg-[#749c83] text-white hover:bg-[#638570]" 
                                : "border-border text-foreground hover:bg-muted"
                            }`}
                        >
                            Semester 2
                        </Button>
                    </div>
            
        </div>
    );
}










