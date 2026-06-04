import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTimetableData } from "@/hooks/TimetableHooks/useTimetableData";
import { useTimetableView } from "@/hooks/TimetableHooks/useTimetableView";
import { useTimetableActions } from "@/hooks/TimetableHooks/useTimetableActions";
import { getCurrentAcadYear, getAcadYearString } from "@/utils/generalUtils/time";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomSlotDialog from "@/components/TimetableComponent/CustomSlotDialog";
import TimetableGrid from "@/components/TimetableComponent/TimetableGrid";
import SearchBar from "@/components/SearchBar";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const HOURS = ["0800", "0900", "1000", "1100", "1200", "1300", "1400", "1500", "1600", "1700", "1800"];
const WEEKS = Array.from({ length: 13 }, (_, i) => i + 1);

export default function TimetablePage({ semester }: { semester: number }) {
    const currentYear = getCurrentAcadYear();
    const acadYearString = getAcadYearString();
    const navigate = useNavigate();
    const [searchResetKey, setSearchResetKey] = useState(0);

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

    // TimetableView abstractions - optimiser, unique modules in active list
    const { lessonsByDay, uniqueActiveModules } = useTimetableView(modules, alternatives);

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

    // 1 NEW HANDLER REQUIRED IN THIS FILE:
    // AddHandler to support searchbar reset - use new key value
    const handleAddModuleWithReset = async (moduleCode: string) => {
        await handleAddModule(moduleCode);
        setSearchResetKey((k) => k + 1);
    };

    
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

                {/* Timetable Matrix Grid */}
                <TimetableGrid 
                    DAYS={DAYS} 
                    HOURS={HOURS} 
                    lessonsByDay={lessonsByDay} 
                    selectedLesson={selectedLesson} 
                    handleSelectClass={handleSelectClass} 
                    handleSwapClass={handleSwapClass} 
                />

                {/* Floating Plus and Custom Block Dialog */}
                <div className="fixed bottom-4 right-4 z-30">
                    <CustomSlotDialog DAYS={DAYS} HOURS={HOURS} WEEKS={WEEKS} onCustomEvent={handleCustomEvent} />
                </div>

                {/* Semester Page Selection */}
                <div className="w-full flex justify-start items-center gap-2 pt-2">
                    <Button
                        variant={semester === 1 ? "default" : "outline"}
                        onClick={() => navigate("/timetable/sem-1")}
                        className={`h-9 px-4 text-xs font-medium cursor-pointer transition-colors duration-150 ${
                            semester === 1 ? "bg-[#749c83] text-white hover:bg-[#638570]" : "border-border"
                        }`}
                    >
                        Semester 1
                    </Button>

                    <Button
                        variant={semester === 2 ? "default" : "outline"}
                        onClick={() => navigate("/timetable/sem-2")}
                        className={`h-9 px-4 text-xs font-medium cursor-pointer transition-colors duration-150 ${
                            semester === 2 ? "bg-[#749c83] text-white hover:bg-[#638570]" : "border-border"
                        }`}
                    >
                        Semester 2
                    </Button>
                </div>

                {/* Search/Add/Delete Modules */}
                <div className="w-full max-w-4xl mx-auto mt-6 space-y-4">
                    <SearchBar key={searchResetKey} onSelect={handleAddModuleWithReset} />

                    {uniqueActiveModules.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm md:text-base font-semibold text-muted-foreground">
                                Active Modules ({uniqueActiveModules.length})
                            </h3>
                            <div className="flex flex-wrap gap-2.5 items-center">
                                {uniqueActiveModules.map((mod) => (
                                    <div
                                        key={mod.moduleCode}
                                        className="flex items-center gap-3 bg-secondary text-secondary-foreground px-4 py-2 h-9 rounded-lg border border-border text-sm font-bold tracking-wide shadow-sm select-none"
                                    >
                                        <span>{mod.moduleCode}</span>
                                        <button
                                            onClick={() => handleRemoveModule(mod.moduleCode)}
                                            className="text-muted-foreground hover:text-destructive rounded-full p-1 hover:bg-muted transition-colors"
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