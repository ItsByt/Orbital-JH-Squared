import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTimetableData } from "@/hooks/useTimetableData";
import { useTimetableView } from "@/hooks/useTimetableView";
import { useTimetableActions } from "@/hooks/useTimetableActions";
import { getCurrentAcadYear, getAcadYearString } from "@/utils/generalUtils/time";
import { convertTimeToColumn } from "@/utils/timetableUtils/timeFormat";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateDayLayout } from "@/utils/timetableUtils/subrowAllocation";
import ClassCard from "@/components/ui/ClassCard";
import SearchBar from "@/components/SearchBar";

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
    const [searchResetKey, setSearchResetKey] = useState(0);

    // Select, Shift, Clear Abstraction Logic
    const {
        modules,
        loading,
        selectedLesson,
        alternatives,
        selectModuleToCompare,
        clearAlternatives,
        swapModuleSlot,
    } = useTimetableData(currentYear, semester);

    // Optimiser and Unique Active Abstraction Logic
    const { lessonsByDay, uniqueActiveModules } = useTimetableView(modules, alternatives);

    // All Handler Abstraction Logic
    const {
        handleSelectClass,
        handleSwapClass,
        handleAddModule,
        handleRemoveModule,
    } = useTimetableActions(
        semester,
        selectedLesson,
        selectModuleToCompare,
        clearAlternatives,
        swapModuleSlot
    );

    // Update handleAdd to include SearchReset
    const handleAddModuleWithReset = async (moduleCode: string) => {
        await handleAddModule(moduleCode);
        setSearchResetKey(k => k + 1);
    };
    
    // Loading Logic
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


    return (
        <div className="w-full min-h-screen flex flex-col items-start justify-start pt-1 px-6 pb-6 space-y-4 bg-background text-foreground transition-colors duration-200">
            <h1
                className="text-4xl font-bold"
                style={{ fontFamily: "Bahnschrift, sans-serif", color: "#56A58B" }}
            >
                {acadYearString} Semester {semester} Timetable
            </h1>

            {/* Timetable Grid Container */}
            <div className="w-full border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                {/* Header Timeline Row */}
                <div className="grid grid-cols-[80px_repeat(22,1fr)] border-b border-border text-center text-xs font-semibold text-muted-foreground select-none bg-muted/50">
                    <div className="p-3 border-r border-border text-left text-foreground font-bold">Day</div>
                    {HOURS.map((hour) => (
                        <div key={hour} className="p-3 col-span-2 text-left pl-2 border-r border-border/40">
                            {hour}
                        </div>
                    ))}
                </div>

                {/* Day Rows */}
                <div className="divide-y divide-border">
                    {DAYS.map((day) => {
                        const allVisibleLessons = lessonsByDay[day] || [];
                        const { totalRowsForDay, lessonRowMap } = calculateDayLayout(allVisibleLessons);

                        return (
                            <div
                                key={day}
                                className="grid grid-cols-[80px_repeat(22,1fr)] relative"
                                style={{ gridTemplateRows: `repeat(${totalRowsForDay}, minmax(112px, auto))` }}
                            >
                                {/* Sticky Day Axis Label */}
                                <div className="p-3 font-bold text-xs border-r border-border bg-muted/20 select-none flex items-center justify-start row-span-full z-10 sticky left-0 backdrop-blur-sm">
                                    {day.substring(0, 3)}
                                </div>

                                {/* Abstracted Grid Lines Background Layout */}
                                <div className="absolute inset-0 left-[80px] grid grid-cols-[repeat(22,1fr)] pointer-events-none select-none">
                                    {Array.from({ length: 22 }).map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-full border-r ${idx % 2 === 1 ? "border-border/40" : "border-border/10 border-dashed"}`}
                                        />
                                    ))}
                                </div>

                                {/* Lesson Blocks Render using ClassCard.tsx */}
                                {allVisibleLessons.map((lesson) => (
                                    <ClassCard
                                        key={lesson.id}
                                        lesson={lesson}
                                        allVisibleLessons={allVisibleLessons}
                                        colStart={convertTimeToColumn(lesson.startTime)}
                                        colEnd={convertTimeToColumn(lesson.endTime)}
                                        rowIndex={(lessonRowMap.get(lesson.id) ?? 0) + 1}
                                        selectedLesson={selectedLesson}
                                        onSelectClass={handleSelectClass}
                                        onSwapClass={handleSwapClass}
                                    />
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Semester Navigation Controls */}
            <div className="w-full flex justify-start items-center gap-2 pt-2">
                <Button
                    variant={semester === 1 ? "default" : "outline"}
                    onClick={() => navigate("/timetable/sem-1")}
                    className={`h-9 px-4 text-xs font-medium transition-all duration-200 cursor-pointer ${
                        semester === 1 ? "bg-[#749c83] text-white hover:bg-[#638570]" : "border-border text-foreground hover:bg-muted"
                    }`}
                >
                    Semester 1
                </Button>

                <Button
                    variant={semester === 2 ? "default" : "outline"}
                    onClick={() => navigate("/timetable/sem-2")}
                    className={`h-9 px-4 text-xs font-medium transition-all duration-200 cursor-pointer ${
                        semester === 2 ? "bg-[#749c83] text-white hover:bg-[#638570]" : "border-border text-foreground hover:bg-muted"
                    }`}
                >
                    Semester 2
                </Button>
            </div>

            {/* Search/Add/Delete Features */}
            <div className="w-full max-w-4xl mx-auto mt-6 space-y-4">
                <SearchBar key={searchResetKey} onSelect={handleAddModuleWithReset} />

                {uniqueActiveModules.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-muted-foreground">Active Modules ({uniqueActiveModules.length})</h3>
                        <div className="flex flex-wrap gap-2">
                            {uniqueActiveModules.map((mod) => (
                                <div
                                    key={mod.moduleCode}
                                    className="flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg border border-border text-xs font-medium animate-in fade-in zoom-in-95 duration-150"
                                >
                                    <span>{mod.moduleCode}</span>
                                    <button
                                        onClick={() => handleRemoveModule(mod.moduleCode)}
                                        className="text-muted-foreground hover:text-destructive rounded-full p-0.5 hover:bg-muted transition-colors duration-150"
                                        aria-label={`Remove ${mod.moduleCode}`}
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}