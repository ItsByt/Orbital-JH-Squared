import ClassCard from "./ClassCard";
import { TOTAL_GRID_COLS } from "@/config/constants";
import { calculateDayLayout } from "@/utils/timetableUtils/subrowAllocation";
import { convertTimeToColumn } from "@/utils/timetableUtils/timeFormat";
import type { DisplayLesson } from "@/types";

interface TimetableGridProps {
    DAYS: string[];
    HOURS: string[];
    lessonsByDay: Record<string, DisplayLesson[]>;
    selectedLesson: DisplayLesson | null;
    handleSelectClass: (lesson: DisplayLesson) => void;
    handleSwapClass: (
        selected: DisplayLesson | null,
        target: DisplayLesson
    ) => void;
    handleUpdateCustomLesson: (lesson: DisplayLesson) => void;
}

export default function TimetableGrid({
    DAYS,
    HOURS,
    lessonsByDay,
    selectedLesson,
    handleSelectClass,
    handleSwapClass,
    handleUpdateCustomLesson,
}: TimetableGridProps) {
    const gridTemplate = `80px repeat(${TOTAL_GRID_COLS}, 1fr)`;

    return (
        <div className="w-full border border-border rounded-xl overflow-x-auto bg-card shadow-sm relative scrollbar-thin">
            <div className="min-w-[1200px]">
                {" "}
                {/* Hour Markings */}
                <div
                    className="grid border-b border-border text-center text-xs font-semibold text-muted-foreground bg-muted/50 select-none"
                    style={{ gridTemplateColumns: gridTemplate }}
                >
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
                {/* Day Rows */}
                <div className="divide-y divide-border">
                    {DAYS.map((day) => {
                        const allVisibleLessons = lessonsByDay[day] || [];
                        const { totalRowsForDay, lessonRowMap } =
                            calculateDayLayout(allVisibleLessons);

                        return (
                            <div
                                key={day}
                                className="grid relative"
                                style={{
                                    gridTemplateColumns: gridTemplate,
                                    gridTemplateRows: `repeat(${totalRowsForDay}, minmax(112px, auto))`,
                                }}
                            >
                                <div className="p-3 font-bold text-xs border-r border-border bg-muted/20 flex items-center justify-start row-span-full z-10 sticky left-0 backdrop-blur-sm">
                                    {day.substring(0, 3)}
                                </div>

                                {/* Background Line Grid */}
                                <div
                                    className="absolute inset-0 left-[80px] grid pointer-events-none select-none"
                                    style={{
                                        gridTemplateColumns: `repeat(${TOTAL_GRID_COLS}, 1fr)`,
                                    }}
                                >
                                    {Array.from({ length: TOTAL_GRID_COLS }).map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-full border-r ${idx % 2 === 1 ? "border-border/40" : "border-border/10 border-dashed"}`}
                                        />
                                    ))}
                                </div>

                                {/* Render all Classes with ClassCards */}
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
                                        onUpdateCustomLesson={handleUpdateCustomLesson}
                                    />
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
