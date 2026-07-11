import { Plus } from "lucide-react";
import { toast } from "sonner";
import { getModule } from "@/services/nusmods";
import { formatWeeksDisplay, weeksToBitmask } from "@/utils/timetableUtils/weekFormat";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { TIMETABLE_WEEKS } from "@/config/constants";
import { DisplayLesson } from "@/types";
import { useEffect, useState } from "react";

interface CustomSlotDialogProps {
    DAYS: string[];
    HOURS: string[];
    WEEKS: number[];

    // Creating a new custom block
    onCustomEvent: (eventData: {
        name: string;
        day: string;
        startTime: string;
        endTime: string;
        venue: string;
        selectedWeeks: number[];
        weekBitmask: number;
        classNo: string;
    }) => Promise<void>;

    // Editing an existing custom block
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    editLesson?: DisplayLesson | null;
    onUpdateCustomEvent?: (
        id: string,
        eventData: {
            name: string;
            day: string;
            startTime: string;
            endTime: string;
            venue: string;
            selectedWeeks: number[];
            weekBitmask: number;
            classNo: string;
        }
    ) => Promise<void>;
}

const DEFAULT_FORM_STATE = {
    name: "",
    day: "Monday",
    start: "0900",
    end: "1100",
    venue: "",
    weeks: TIMETABLE_WEEKS,
    checkOverlap: true,
};

export default function CustomSlotDialog({
    DAYS,
    HOURS,
    WEEKS,
    onCustomEvent,
    open,
    onOpenChange,
    editLesson,
    onUpdateCustomEvent,
}: CustomSlotDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isDialogOpen = open ?? internalOpen;
    const setDialogOpen = (value:boolean) => {
        setInternalOpen(value);
        onOpenChange?.(value);
    };
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Use a Unified State Object
    const [formData, setFormData] = useState({ ...DEFAULT_FORM_STATE, weeks: WEEKS });

    useEffect(() => {
        if (!editLesson) {
            setFormData({
                ...DEFAULT_FORM_STATE,
                weeks: WEEKS,
            });
            return;
        }
        setFormData({
            name: editLesson.moduleCode,
            day: editLesson.day,
            start: editLesson.startTime,
            end: editLesson.endTime,
            venue: editLesson.venue ?? "",
            weeks: editLesson.weeks ?? [],
            checkOverlap: editLesson.classNo !== "CUSTOM_IGNORE_FLAG",
        });

    }, [editLesson, WEEKS]);


    // Helper to update individual fields
    const updateField = <K extends keyof typeof DEFAULT_FORM_STATE>(
        field: K, // key to be updated
        value: (typeof DEFAULT_FORM_STATE)[K] // to enforce that the value must match the type of the field
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleWeekToggle = (week: number) => {
        const newWeeks = formData.weeks.includes(week)
            ? formData.weeks.filter((w) => w !== week)
            : [...formData.weeks, week].sort((a, b) => a - b);
        updateField("weeks", newWeeks);
    };

    // Validation Check
    const validateForm = async (): Promise<boolean> => {
        const normalizedName = formData.name.trim();

        if (!normalizedName) {
            toast.error("Missing Input", { description: "Please enter a valid name." });
            return false;
        }
        if (parseInt(formData.end, 10) <= parseInt(formData.start, 10)) {
            toast.error("Invalid Time", {
                description: "End time must be strictly after the start time.",
            });
            return false;
        }
        if (formData.weeks.length === 0) {
            toast.error("Invalid Selection", { description: "Please select at least one week." });
            return false;
        }

        try {
            // Check if name conflicts with an official NUS module
            const matchingModule = await getModule(normalizedName.toUpperCase());
            if (matchingModule?.moduleCode) {
                toast.error("Naming Conflict", {
                    description: `"${normalizedName}" already exists as an official module.`,
                });
                return false;
            }
        } catch {
            // If getModule fails (e.g., network error), we allow creation rather than blocking the user
            console.warn("Could not validate against NUSMods API.");
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const isValid = await validateForm();
            if (!isValid) return;

            // format to allow comparison with NUSAPI's module names
            // but don't uppercase here, do it when comparing
            const normalizedName = formData.name.trim();

            const updatedData = {
                name: normalizedName,
                day: formData.day,
                startTime: formData.start,
                endTime: formData.end,
                venue: formData.venue,
                selectedWeeks: formData.weeks,
                weekBitmask: weeksToBitmask(formData.weeks),
                classNo: formData.checkOverlap
                    ? "CUSTOM"
                    : "CUSTOM_IGNORE_FLAG",
            };


            if (editLesson && onUpdateCustomEvent) {

                await onUpdateCustomEvent(
                    editLesson.id,
                    updatedData
                );

            } else {

                await onCustomEvent(updatedData);

            }

            setDialogOpen(false);
            setFormData({ ...DEFAULT_FORM_STATE, weeks: WEEKS });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            {!editLesson && (
                <DialogTrigger asChild>
                    <Button
                        size="icon"
                        className="h-12 w-12 rounded-full bg-[#56A58B] hover:bg-[#458570] text-white shadow-lg cursor-pointer transition-transform duration-200 hover:scale-105"
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>
                        {editLesson ? "Edit Custom Block" : "Customizable Block Creator"}
                    </DialogTitle>

                    <DialogDescription>
                        {editLesson
                            ? "Update your personal event."
                            : "Add your own personal events!"
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {/* Activity Name */}
                    <div className="space-y-1">
                        <Label htmlFor="custom-name">Activity Name</Label>
                        <Input
                            id="custom-name"
                            placeholder="e.g. CCAs, Mealtime, Gym"
                            value={formData.name}
                            onChange={(e) => updateField("name", e.target.value)}
                            required
                        />
                    </div>

                    {/* Day & Venue Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="custom-day">Day</Label>
                            <select
                                id="custom-day"
                                value={formData.day}
                                onChange={(e) => updateField("day", e.target.value)}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                {DAYS.map((d) => (
                                    <option key={d} value={d}>
                                        {d}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="custom-venue">Venue</Label>
                            <Input
                                id="custom-venue"
                                placeholder="Optional"
                                value={formData.venue}
                                onChange={(e) => updateField("venue", e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Time Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="custom-start">Start Time</Label>
                            <select
                                id="custom-start"
                                value={formData.start}
                                onChange={(e) => updateField("start", e.target.value)}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                {HOURS.map((h) => (
                                    <option key={h} value={h}>
                                        {h}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="custom-end">End Time</Label>
                            <select
                                id="custom-end"
                                value={formData.end}
                                onChange={(e) => updateField("end", e.target.value)}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                {HOURS.map((h) => (
                                    <option key={h} value={h}>
                                        {h}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Week Selection */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label>Weeks</Label>
                            <span className="text-xs font-semibold text-[#56A58B] bg-[#56A58B]/10 px-2 py-0.5 rounded-md">
                                {formatWeeksDisplay(formData.weeks)}
                            </span>
                        </div>
                        <div className="grid grid-cols-5 gap-2 p-3 border border-border rounded-lg bg-muted/20">
                            {WEEKS.map((w) => (
                                <div key={w} className="flex items-center space-x-1.5">
                                    <Checkbox
                                        id={`week-${w}`}
                                        checked={formData.weeks.includes(w)}
                                        onCheckedChange={() => handleWeekToggle(w)}
                                    />
                                    <label
                                        htmlFor={`week-${w}`}
                                        className="text-xs font-medium cursor-pointer select-none"
                                    >
                                        W{w}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Overlap Flag Enabler/Disabler */}
                    <div className="flex items-start space-x-2 pt-2 border-t border-border/60">
                        <input
                            type="checkbox"
                            id="custom-overlap"
                            checked={formData.checkOverlap}
                            onChange={(e) => updateField("checkOverlap", e.target.checked)}
                            className="h-4 w-4 mt-0.5 rounded border-input text-[#56A58B] focus:ring-[#56A58B] accent-[#56A58B] cursor-pointer"
                        />
                        <div className="grid gap-1 leading-none">
                            <label
                                htmlFor="custom-overlap"
                                className="text-xs font-semibold cursor-pointer select-none text-foreground"
                            >
                                Flag if clashing schedule?
                            </label>
                            <p className="text-[11px] text-muted-foreground select-none">
                                Turn this on if you want to be notified of clashes.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-[#749c83] hover:bg-[#638570] text-white"
                        >
                            {
                                isSubmitting
                                    ? "Saving..."
                                    : editLesson
                                        ? "Update Schedule"
                                        : "Insert into Schedule"
                            }
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
