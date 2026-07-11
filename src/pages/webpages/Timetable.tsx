import { useTimetableData } from "@/hooks/TimetableHooks/useTimetableData";
import { useTimetableView } from "@/hooks/TimetableHooks/useTimetableView";
import { useTimetableActions } from "@/hooks/TimetableHooks/useTimetableActions";
import { getCurrentAcadYear, getAcadYearStringSlash } from "@/utils/generalUtils/time";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import CustomSlotDialog from "@/components/TimetableComponents/CustomSlotDialog";
import SemesterNavigation from "@/components/TimetableComponents/SemesterNavigation";
import ActiveContainer from "@/components/TimetableComponents/ActiveContainer";
import TimetableGrid from "@/components/TimetableComponents/TimetableGrid";
import { DisplayLesson } from "@/types";
import { DAYS, TIMETABLE_HOURS, TIMETABLE_WEEKS } from "@/config/constants";

export default function TimetablePage({ semester }: { semester: number }) {
    const currentYear = getCurrentAcadYear();
    const acadYearString = getAcadYearStringSlash();
    const [editingLesson, setEditingLesson] = useState<DisplayLesson | null>(null);
    const [customDialogOpen, setCustomDialogOpen] = useState(false);

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
        handleUpdateCustomEvent,
        handleUpdateColor,
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
        <div className="w-full h-full overflow-y-auto flex flex-col items-start justify-start pt-4 px-6 pb-20 space-y-6 bg-background text-foreground">
            <h1
                className="text-4xl font-bold"
                style={{ fontFamily: "Bahnschrift, sans-serif", color: "#56A58B" }}
            >
                {acadYearString} Semester {semester} Timetable
            </h1>

            <div className="w-full shrink-0">
                {/* Scalable Timetable Grid (sem nav and custom anchored) */}
                <TimetableGrid
                    DAYS={DAYS}
                    HOURS={TIMETABLE_HOURS}
                    lessonsByDay={lessonsByDay}
                    selectedLesson={selectedLesson}
                    handleSelectClass={handleSelectClass}
                    handleSwapClass={handleSwapClass}
                    handleUpdateCustomLesson={(lesson) => {
                        setEditingLesson(lesson);
                        setCustomDialogOpen(true);
                    }}
                />

                <div className="w-full flex items-center justify-between mt-4">
                    {/* Semester Navigation */}
                    <SemesterNavigation semester={semester} />

                    {/* Add Custom Event PLUS */}
                    <CustomSlotDialog
                        DAYS={DAYS}
                        HOURS={TIMETABLE_HOURS}
                        WEEKS={TIMETABLE_WEEKS}
                        open={customDialogOpen}
                        onOpenChange={setCustomDialogOpen}
                        editLesson={editingLesson}
                        onCustomEvent={handleCustomEvent}
                        onUpdateCustomEvent={handleUpdateCustomEvent}
                    />
                </div>
            </div>

            {/* Search/Add/Delete Modules */}
            <ActiveContainer
                uniqueActiveModules={uniqueActiveModules}
                customNameCounts={customNameCounts}
                handleAddModule={handleAddModule}
                handleRemoveModule={handleRemoveModule}
                semester={semester}
                handleUpdateColor={handleUpdateColor}
            />
        </div>
    );
}
