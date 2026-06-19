import { type DisplayLesson } from "@/types";
import { formatWeeksDisplay, bitmaskToWeeks } from "@/utils/timetableUtils/weekFormat";
import { doLessonsSchedulesClash } from "@/utils/timetableUtils/lessonClashDetection";

// Now handles abstraction for clash logic and
// all other details pertaining to class card
export default function ClassCard({
    lesson,
    allVisibleLessons,
    colStart,
    colEnd,
    rowIndex,
    selectedLesson,
    onSelectClass,
    onSwapClass,
}: {
    lesson: DisplayLesson;
    allVisibleLessons: DisplayLesson[];
    colStart: number;
    colEnd: number;
    rowIndex: number;
    selectedLesson: DisplayLesson | null;
    onSelectClass: (lesson: DisplayLesson) => void;
    onSwapClass: (selected: DisplayLesson | null, target: DisplayLesson) => void;
}) {
    // Conflict Logic - filter out to get conflict classes by ignoring...
    // 1. alternatives
    // 2. itself
    // 3. same overlap timing but is the SAME class (EITHER IS NOT CUSTOM, SO CONTINUOUS)
    const conflictingLessons = lesson.isAlternative
        ? []
        : allVisibleLessons.filter((other) => {
              if (other.isAlternative || other.id === lesson.id) return false;
              const isCustomA =
                  lesson.classNo.startsWith("CUSTOM") || lesson.lessonType === "Personal Block";
              const isCustomB =
                  other.classNo.startsWith("CUSTOM") || other.lessonType === "Personal Block";
              if (!isCustomA || !isCustomB) {
                  if (
                      other.moduleCode === lesson.moduleCode &&
                      other.classNo === lesson.classNo &&
                      other.lessonType === lesson.lessonType
                  ) {
                      return false;
                  }
              }
              return doLessonsSchedulesClash(lesson, other);
          });

    // hasOverlap true if exists conflicting lesson
    const hasOverlap = conflictingLessons.length > 0;

    // Basic Hover warning
    const warningTooltip = hasOverlap
        ? `TIMETABLE CLASH: Overlaps with ${conflictingLessons
              .map((c) => `${c.moduleCode} (${c.lessonType})`)
              .join(", ")}`
        : undefined;

    const handleClick = () => {
        if (lesson.isAlternative) {
            onSwapClass(selectedLesson, lesson);
        } else {
            onSelectClass(lesson);
        }
    };

    return (
        <div
            title={warningTooltip}
            onClick={handleClick}
            style={{
                gridColumnStart: colStart + 1,
                gridColumnEnd: colEnd + 1,
                gridRowStart: rowIndex,
            }}
            className={`my-1 mx-0.5 p-2 rounded shadow-sm text-xs flex flex-col justify-between overflow-hidden cursor-pointer transition-all duration-300 z-20 border
                ${
                    lesson.isAlternative
                        ? // amber if alt
                          "bg-amber-500/20 dark:bg-amber-500/10 border-dashed border-amber-400 opacity-60 hover:opacity-100 hover:bg-amber-500/30"
                        : hasOverlap
                          ? // pulse red if conflict
                            "bg-destructive/10 border-destructive shadow-[0_0_15px_rgba(239,68,68,0.5)] dark:shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse hover:animate-none group"
                          : // otherwise standard purple
                            "bg-purple-500/10 dark:bg-purple-500/20 border-purple-400/40 dark:border-purple-400/30 hover:bg-purple-500/20"
                }`}
        >
            <div className="flex flex-col space-y-0.5">
                <div className="flex items-center justify-between">
                    <span
                        className={`font-bold tracking-wide ${hasOverlap ? "text-destructive font-extrabold" : "text-foreground"}`}
                    >
                        {lesson.moduleCode}
                    </span>
                    {hasOverlap && (
                        <span
                            className="text-destructive text-xs font-bold animate-bounce"
                            aria-hidden="true"
                        >
                            ⚠️
                        </span>
                    )}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    {lesson.lessonType}{" "}
                    {!lesson.classNo.startsWith("CUSTOM") && ` [${lesson.classNo}]`}
                </span>
            </div>

            <div className="flex flex-col space-y-0.5 mt-2">
                <span className="text-[11px] font-medium text-muted-foreground truncate">
                    {lesson.venue || "No Venue"}
                </span>
                <span
                    className={`text-[10px] ${hasOverlap ? "text-destructive/90 font-medium" : "text-muted-foreground"}`}
                >
                    {formatWeeksDisplay(bitmaskToWeeks(lesson.weekBitmask))}
                </span>
            </div>
        </div>
    );
}
