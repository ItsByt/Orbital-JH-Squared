import { useTimetableData } from "@/hooks/TimetableHooks/useTimetableData";
import { useTimetableView } from "@/hooks/TimetableHooks/useTimetableView";
import { useTimetableActions } from "@/hooks/TimetableHooks/useTimetableActions";
import { getCurrentAcadYear, getAcadYearString } from "@/utils/generalUtils/time";
import { Loader2 } from "lucide-react";

import CustomSlotDialog from "@/components/TimetableComponent/CustomSlotDialog";
import SemesterNavigation from "@/components/TimetableComponent/SemesterNavigation";
import ActiveContainer from "@/components/TimetableComponent/ActiveContainer";
import TimetableGrid from "@/components/TimetableComponent/TimetableGrid";

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
const WEEKS = Array.from({ length: 13 }, (_, i) => i + 1);

export default function TimetablePage({ semester }: { semester: number }) {
    const currentYear = getCurrentAcadYear();
    const acadYearString = getAcadYearString();

    // TimetableData abstractions - retrieve, select and swap
    const {
        modules,
        loading,
        selectedLesson,
        alternatives,
        selectModuleToCompare,
        clearAlternatives,
        swapModuleSlot,
    } = useTimetableData(currentYear, semester);

    // TimetableView abstractions - optimiser, unique modules in active list, number of customs
    const { lessonsByDay, uniqueActiveModules, customNameCounts } = useTimetableView(
        modules,
        alternatives
    );

    // TimetableActions abstractions - all handler functions called from frontend
    const {
        handleSelectClass,
        handleSwapClass,
        handleAddModule,
        handleRemoveModule,
        handleCustomEvent,
    } = useTimetableActions(
        semester,
        selectedLesson,
        selectModuleToCompare,
        clearAlternatives,
        swapModuleSlot
    );

    // The usual loading
    if (loading) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
                <Loader2 className="h-10 w-10 animate-spin text-[#749c83]" />
                <span className="ml-3 mt-4 text-base font-medium text-muted-foreground">
                    Loading timetable data...
                </span>
            </div>
        );
    }

    //_________________________________FRONTEND_________________________________________//
    return (
        <div className="w-full min-h-screen flex flex-col items-start justify-start pt-1 px-6 pb-6 space-y-4 bg-background text-foreground relative">
            <h1
                className="text-4xl font-bold"
                style={{ fontFamily: "Bahnschrift, sans-serif", color: "#56A58B" }}
            >
                {acadYearString} Semester {semester} Timetable
            </h1>

            <div className="w-full relative">
                {/* Scalable Timetable Grid (sem nav and custom anchored) */}
                <TimetableGrid
                    DAYS={DAYS}
                    HOURS={HOURS}
                    lessonsByDay={lessonsByDay}
                    selectedLesson={selectedLesson}
                    handleSelectClass={handleSelectClass}
                    handleSwapClass={handleSwapClass}
                />

                <div className="w-full flex items-center justify-between mt-4">
                    {/* Semester Navigation */}
                    <SemesterNavigation semester={semester} />

                    {/* Add Custom Event PLUS */}
                    <CustomSlotDialog
                        DAYS={DAYS}
                        HOURS={HOURS}
                        WEEKS={WEEKS}
                        onCustomEvent={handleCustomEvent}
                    />
                </div>
            </div>

            {/* Search/Add/Delete Modules */}
            <ActiveContainer
                uniqueActiveModules={uniqueActiveModules}
                customNameCounts={customNameCounts}
                handleAddModule={handleAddModule}
                handleRemoveModule={handleRemoveModule}
            />
        </div>
    );
}
