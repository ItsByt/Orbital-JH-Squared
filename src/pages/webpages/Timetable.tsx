import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTimetableData } from "@/hooks/useTimetableData";
import { useTimetableView } from "@/hooks/useTimetableView";
import { useTimetableActions } from "@/hooks/useTimetableActions";
import { getCurrentAcadYear, getAcadYearString } from "@/utils/generalUtils/time";
import { convertTimeToColumn } from "@/utils/timetableUtils/timeFormat";
import { Loader2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateDayLayout } from "@/utils/timetableUtils/subrowAllocation";
import ClassCard from "@/components/ui/ClassCard";
import SearchBar from "@/components/SearchBar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter, 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const HOURS = ["0800", "0900", "1000", "1100", "1200", "1300", "1400", "1500", "1600", "1700", "1800"];

export default function TimetablePage({ semester }: { semester: number }) {
    const currentYear = getCurrentAcadYear();
    const acadYearString = getAcadYearString();
    const navigate = useNavigate();
    const [searchResetKey, setSearchResetKey] = useState(0);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Dialog Input Form for Customized Blocks
    const [formName, setFormName] = useState("");
    const [formDay, setFormDay] = useState("Monday");
    const [formStart, setFormStart] = useState("0900");
    const [formEnd, setFormEnd] = useState("1100");
    const [formVenue, setFormVenue] = useState("");
    

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

    // Updated to support searchbar reset
    const handleAddModuleWithReset = async (moduleCode: string) => {
        await handleAddModule(moduleCode);
        setSearchResetKey((k) => k + 1);
    };

    // React Submit form for Custom blocks
    const handleCreateCustomSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();

        // Error Handling: empty name / invalid start end time
        if (!formName.trim()) return;
        if (parseInt(formEnd, 10) <= parseInt(formStart, 10)) {
            alert("Invalid Time Selection: End time must be strictly after the start time.");
            return; 
        }

        await handleCustomEvent({
            name: formName,
            day: formDay,
            startTime: formStart,
            endTime: formEnd,
            venue: formVenue,
        });

        setIsDialogOpen(false);
        setFormName("");
        setFormVenue("");
    };
    
    // Loading
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
            <div className="w-full border border-border rounded-xl overflow-hidden bg-card shadow-sm relative">
                {/* Hour Markings */}
                <div className="grid grid-cols-[80px_repeat(22,1fr)] border-b border-border text-center text-xs font-semibold text-muted-foreground bg-muted/50 select-none">
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
                                {/* Day Column Titles */}
                                <div className="p-3 font-bold text-xs border-r border-border bg-muted/20 flex items-center justify-start row-span-full z-10 sticky left-0 backdrop-blur-sm select-none">
                                    {day.substring(0, 3)}
                                </div>

                                {/* Background Line Grid */}
                                <div className="absolute inset-0 left-[80px] grid grid-cols-[repeat(22,1fr)] pointer-events-none select-none">
                                    {Array.from({ length: 22 }).map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-full border-r ${idx % 2 === 1 ? "border-border/40" : "border-border/10 border-dashed"}`}
                                        />
                                    ))}
                                </div>

                                {/* All Rendered active blocks with ClassCard */}
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

                {/* Floating plus to make custom block*/}
                <div className="absolute bottom-4 right-4 z-30">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button 
                                size="icon"
                                className="h-12 w-12 rounded-full bg-[#56A58B] hover:bg-[#458570] text-white shadow-lg cursor-pointer transition-transform duration-200 hover:scale-105"
                            >
                                <Plus className="h-6 w-6" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[420px]">
                            <DialogHeader>
                                <DialogTitle>Custom Slot Creator</DialogTitle>
                                <DialogDescription>Add your own personal events!</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateCustomSubmit} className="space-y-4 pt-2">
                                <div className="space-y-1">
                                    <Label htmlFor="custom-name">Activity Name</Label>
                                    <Input 
                                        id="custom-name" 
                                        placeholder="e.g. CCAs, Mealtime, Gym" 
                                        value={formName} 
                                        onChange={(e) => setFormName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="custom-day">Day</Label>
                                        <select 
                                            id="custom-day"
                                            value={formDay}
                                            onChange={(e) => setFormDay(e.target.value)}
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        >
                                            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="custom-venue">Venue</Label>
                                        <Input 
                                            id="custom-venue" 
                                            placeholder="e.g. University Town" 
                                            value={formVenue} 
                                            onChange={(e) => setFormVenue(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="custom-start">Start Time</Label>
                                        <select 
                                            id="custom-start"
                                            value={formStart}
                                            onChange={(e) => setFormStart(e.target.value)}
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        >
                                            {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="custom-end">End Time</Label>
                                        <select 
                                            id="custom-end"
                                            value={formEnd}
                                            onChange={(e) => setFormEnd(e.target.value)}
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        >
                                            {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <DialogFooter className="pt-2">
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="bg-[#749c83] hover:bg-[#638570] text-white">
                                        Insert into Schedule
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
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
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-muted-foreground">Active Modules ({uniqueActiveModules.length})</h3>
                        <div className="flex flex-wrap gap-2">
                            {uniqueActiveModules.map((mod) => (
                                <div
                                    key={mod.moduleCode}
                                    className="flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg border border-border text-xs font-medium"
                                >
                                    <span>{mod.moduleCode}</span>
                                    <button
                                        onClick={() => handleRemoveModule(mod.moduleCode)}
                                        className="text-muted-foreground hover:text-destructive rounded-full p-0.5 hover:bg-muted transition-colors"
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