import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTimetableData } from "@/hooks/useTimetableData";
import { getCurrentAcadYear, getAcadYearString } from "@/utils/time";
import { convertTimeToColumn } from "@/utils/timetableUtils/timeFormat";
import type { DisplayLesson } from "@/types";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateDayLayout } from "@/utils/timetableUtils/subrowAllocation";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const HOURS = [
    "0800",
    "0900",
    "1000",
    "1100",
    "1200",
    "1300",
    "1400",
    "1500",
    "1600",
    "1700",
    "1800",
];

export default function TimetablePage({ semester }: { semester: number }) {
    const currentYear: number = getCurrentAcadYear();
    const acadYearString: string = getAcadYearString();
    const navigate = useNavigate();

    const {
        modules,
        loading,
        selectedLesson,
        alternatives,
        selectModuleToCompare,
        clearAlternatives,
        swapModuleSlot,
    } = useTimetableData(currentYear, semester);

    // Optimisation:
    // Group lessons by day only when modules or alternatives change.
    // and process all logic here once
    const lessonsByDay = useMemo(() => {
        const grouped: Record<string, DisplayLesson[]> = {
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: [],
        };

        // Add current modules
        modules.forEach((mod) => {
            if (grouped[mod.day]) grouped[mod.day].push(mod);
        });

        // Add alternatives
        alternatives.forEach((alt) => {
            const isAlreadySelected = modules.some(
                (mod) =>
                    mod.moduleCode === alt.moduleCode &&
                    mod.classNo === alt.classNo &&
                    mod.day === alt.day &&
                    mod.startTime === alt.startTime
            );

            if (!isAlreadySelected && grouped[alt.day]) {
                grouped[alt.day].push({ ...alt, isAlternative: true });
            }
        });

        return grouped;
    }, [modules, alternatives]);

    // Loading
    if (loading) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground transition-colors duration-200">
                <Loader2 className="h-10 w-10 animate-spin text-[#749c83]" />
                <span className="ml-3 mt-4 text-base font-medium text-muted-foreground">
                    Loading timetable data...
                </span>
            </div>
        );
    }

    // clicking selected class to show alternatives
    const handleSelectClass = (lesson: DisplayLesson) => {
        if (selectedLesson && selectedLesson.id === lesson.id) {
            clearAlternatives();
        } else {
            selectModuleToCompare(lesson);
        }
    };

    // clicking alternatives to shift class
    const handleSwapClass = async (
        oldLesson: DisplayLesson | null,
        chosenAlternative: DisplayLesson
    ) => {
        if (!oldLesson) return;

        try {
            await swapModuleSlot(oldLesson, chosenAlternative);
        } catch (err) {
            console.error("Failed to change class:", err);
        }
    };

    return (
        <div className="w-full min-h-screen flex flex-col items-start justify-start pt-1 px-6 pb-6 space-y-4 bg-background text-foreground transition-colors duration-200">
            <h1
                className="text-4xl font-bold"
                style={{
                    fontFamily: "Bahnschrift, sans-serif",
                    color: "#56A58B",
                }}
            >
                {acadYearString} Semester {semester} Timetable
            </h1>

            {/* Timetable Grid Container  */}
            <div className="w-full border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                {/* Header Row */}
                <div className="grid grid-cols-[80px_repeat(22,1fr)] border-b border-border text-center text-xs font-semibold text-muted-foreground select-none bg-muted/50">
                    <div className="p-3 border-r border-border text-left text-foreground font-bold">
                        Day
                    </div>
                    {HOURS.map((hour) => (
                        <div
                            key={hour}
                            className="p-3 col-span-2 text-left pl-2 border-r border-border/40"
                        >
                            {hour}
                        </div>
                    ))}
                </div>

                {/* Grid Contents */}

                <div className="divide-y divide-border">
                    {/* // For each day, get lessons matching that day */}
                    {DAYS.map((day) => {
                        // Get the lessons directly from the useMemo dictionary
                        const allVisibleLessons = lessonsByDay[day] || [];
                        const { totalRowsForDay, lessonRowMap } =
                            calculateDayLayout(allVisibleLessons);

                        return (
                            <div
                                key={day}
                                className="grid grid-cols-[80px_repeat(22,1fr)] relative"
                                style={{
                                    gridTemplateRows: `repeat(${totalRowsForDay}, minmax(112px, auto))`,
                                }}
                            >
                                {/*  Day Label Column */}
                                <div className="p-3 font-bold text-xs border-r border-border bg-muted/20 select-none flex items-center justify-start row-span-full z-10 sticky left-0 backdrop-blur-sm">
                                    {day.substring(0, 3)}
                                </div>

                                {/* Background Grid Lines */}
                                <div className="absolute inset-0 left-[80px] grid grid-cols-[repeat(22,1fr)] pointer-events-none select-none">
                                    {Array.from({ length: 22 }).map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-full border-r ${
                                                idx % 2 === 1
                                                    ? "border-border/40"
                                                    : "border-border/10 border-dashed"
                                            }`}
                                        />
                                    ))}
                                </div>

                                {/* Render Lesson Blocks */}
                                {allVisibleLessons.map((lesson) => {
                                    const colStart = convertTimeToColumn(lesson.startTime);
                                    const colEnd = convertTimeToColumn(lesson.endTime);
                                    const rowIndex = (lessonRowMap.get(lesson.id) ?? 0) + 1;

                                    return (
                                        <div
                                            key={lesson.id}
                                            style={{
                                                gridColumnStart: colStart + 1,
                                                gridColumnEnd: colEnd + 1,
                                                gridRowStart: rowIndex,
                                            }}
                                            // IMPORTANT: this will run the hooks
                                            // which updates Visible Lessons forcing
                                            // rerender and hence new blocks being subrow allocated
                                            // or removed depending on nature of block clicked.
                                            onClick={() => {
                                                if (lesson.isAlternative) {
                                                    // clicked alternative
                                                    handleSwapClass(selectedLesson, lesson);
                                                } else {
                                                    // clicked user selected
                                                    handleSelectClass(lesson);
                                                }
                                            }}
                                            // alternative or selected display design
                                            className={`my-1 mx-0.5 p-2 rounded shadow-sm text-xs flex flex-col justify-between overflow-hidden cursor-pointer transition-all duration-200 z-20 border
                                            ${
                                                lesson.isAlternative
                                                    ? "bg-amber-500/20 dark:bg-amber-500/10 border-dashed border-amber-400 opacity-60 hover:opacity-100 hover:bg-amber-500/30"
                                                    : "bg-purple-500/10 dark:bg-purple-500/20 border-purple-400/40 dark:border-purple-400/30 hover:bg-purple-500/20"
                                            }`}
                                        >
                                            {/* Module Details */}
                                            <div className="flex flex-col space-y-0.5">
                                                <span className="font-bold tracking-wide text-foreground">
                                                    {lesson.moduleCode}
                                                </span>
                                                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                                    {lesson.lessonType} [{lesson.classNo}]
                                                </span>
                                            </div>

                                            <div className="flex flex-col space-y-0.5 mt-2">
                                                <span className="text-[11px] font-medium text-muted-foreground truncate">
                                                    {lesson.venue || "No Venue"}
                                                </span>
                                            </div>
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
