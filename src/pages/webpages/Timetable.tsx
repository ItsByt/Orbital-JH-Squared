import { useTimetableData } from "@/hooks/TimetableHooks/useTimetableData";
import { useTimetableView } from "@/hooks/TimetableHooks/useTimetableView";
import { useTimetableActions } from "@/hooks/TimetableHooks/useTimetableActions";
import { useTimetableSettings } from "@/hooks/TimetableHooks/useTimetableSettings";
import { useTimetableExport } from "@/hooks/TimetableHooks/useTimetableExport";
import { getCurrentAcadYear, getAcadYearStringSlash } from "@/utils/generalUtils/time";
import { Loader2, Download } from "lucide-react";
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

    // TimetableSettings/Export abstractions - memoized hour range, download
    const { dynamicHours } = useTimetableSettings();
    const { timetableRef, captureMode, downloadTimetable } = useTimetableExport(semester);

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
                <div ref={timetableRef} className="bg-background ">
                    {/* Scalable Timetable Grid (sem nav and custom anchored) */}
                    <TimetableGrid
                        DAYS={DAYS}
                        HOURS={dynamicHours}
                        lessonsByDay={lessonsByDay}
                        selectedLesson={selectedLesson}
                        handleSelectClass={handleSelectClass}
                        handleSwapClass={handleSwapClass}
                        handleUpdateCustomLesson={(lesson) => {
                            setEditingLesson(lesson);
                            setCustomDialogOpen(true);
                        }}
                        captureMode={captureMode}
                    />
                </div>

                <div className="w-full flex items-center justify-between mt-4">
                    <SemesterNavigation semester={semester} />

                    <div className="flex items-center gap-4">
                        {/* Download Button */}
                        <button
                            onClick={downloadTimetable}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                        </button>

                        {/* Add Custom Event PLUS/EDIT */}
                        <CustomSlotDialog
                            DAYS={DAYS}
                            HOURS={TIMETABLE_HOURS}
                            WEEKS={TIMETABLE_WEEKS}
                            open={customDialogOpen}
                            onOpenChange={(open) => {
                                setCustomDialogOpen(open);
                                if (!open) {
                                    setEditingLesson(null);
                                }
                            }}
                            editLesson={editingLesson}
                            onCustomEvent={handleCustomEvent}
                            onUpdateCustomEvent={handleUpdateCustomEvent}
                        />
                    </div>
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
