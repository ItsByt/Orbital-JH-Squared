import { useTimetableData } from "@/hooks/TimetableHooks/useTimetableData";
import { useTimetableView } from "@/hooks/TimetableHooks/useTimetableView";
import { useTimetableActions } from "@/hooks/TimetableHooks/useTimetableActions";
import { getCurrentAcadYear, getAcadYearStringSlash } from "@/utils/generalUtils/time";
import { Loader2, Download } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import * as htmlToImage from "html-to-image";
import CustomSlotDialog from "@/components/TimetableComponents/CustomSlotDialog";
import SemesterNavigation from "@/components/TimetableComponents/SemesterNavigation";
import ActiveContainer from "@/components/TimetableComponents/ActiveContainer";
import TimetableGrid from "@/components/TimetableComponents/TimetableGrid";
import { DisplayLesson } from "@/types";
import { DAYS, TIMETABLE_HOURS, TIMETABLE_WEEKS } from "@/config/constants";
import { supabase } from "@/services/supabase";
import { useSettingsStore } from "@/store/useSettingsStore";

export default function TimetablePage({ semester }: { semester: number }) {
    const currentYear = getCurrentAcadYear();
    const acadYearString = getAcadYearStringSlash();
    const [editingLesson, setEditingLesson] = useState<DisplayLesson | null>(null);
    const [customDialogOpen, setCustomDialogOpen] = useState(false);
    const { startHour, endHour, hydrateSettings } = useSettingsStore();
    const [hasHydrated, setHasHydrated] = useState(false);
    const [captureMode, setCaptureMode] = useState(false);
    const timetableRef = useRef<HTMLDivElement>(null);

    // Load Settings
    useEffect(() => {
        if (hasHydrated) return;
        async function loadUserSettings() {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;
            const { data, error } = await supabase
                .from("accessibilities")
                .select("start_hour, end_hour, card_font_size, card_font_family")
                .eq("id", user.id);

            if (error) {
                console.error("Fetch error:", error);
                return;
            }
            if (data && data.length > 0) {
                const settings = data[0];
                hydrateSettings({
                    startHour: settings.start_hour,
                    endHour: settings.end_hour,
                    cardFontSize: settings.card_font_size,
                    cardFontFamily: settings.card_font_family,
                });
            }
            setHasHydrated(true);
        }
        loadUserSettings();
    }, [hydrateSettings, hasHydrated]);

    // Download functionality
    const downloadTimetable = async () => {
        if (!timetableRef.current) return;
        const element = timetableRef.current;
        setCaptureMode(true);
        await new Promise((resolve) => requestAnimationFrame(resolve));

        const originalStyle = {
            width: element.style.width,
            height: element.style.height,
            overflow: element.style.overflow,
        };

        try {
            const fullWidth = element.scrollWidth;
            const fullHeight = element.scrollHeight;

            // Temporarily expand only for capture (the dumb thing only captures viewport)
            element.style.width = `${fullWidth}px`;
            element.style.height = `${fullHeight}px`;
            element.style.overflow = "visible";

            await new Promise((resolve) => requestAnimationFrame(resolve));

            const dataUrl = await htmlToImage.toPng(element, {
                backgroundColor: "#121212",
                pixelRatio: 2,
                width: fullWidth,
                height: fullHeight,
                cacheBust: true,
            });

            const link = document.createElement("a");
            link.download = `semester-${semester}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Failed to export timetable:", err);
        } finally {
            element.style.width = originalStyle.width;
            element.style.height = originalStyle.height;
            element.style.overflow = originalStyle.overflow;
            setCaptureMode(false);
        }
    };

    // Settings chosen array size
    const dynamicHours: string[] = [];
    for (let i = startHour; i <= endHour; i++) {
        dynamicHours.push(`${i.toString().padStart(2, "0")}00`);
    }

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
