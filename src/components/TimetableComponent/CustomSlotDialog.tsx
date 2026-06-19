import { useState } from "react";
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
import { Plus } from "lucide-react";
import { formatWeeksDisplay, weeksToBitmask } from "@/utils/timetableUtils/weekFormat";
import { getModule } from "@/services/nusmods";
import { toast } from "sonner";

interface CustomSlotDialogProps {
    DAYS: string[];
    HOURS: string[];
    WEEKS: number[];
    onCustomEvent: (eventData: any) => Promise<void>;
}

export default function CustomSlotDialog({
    DAYS,
    HOURS,
    WEEKS,
    onCustomEvent,
}: CustomSlotDialogProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formName, setFormName] = useState("");
    const [formDay, setFormDay] = useState("Monday");
    const [formStart, setFormStart] = useState("0900");
    const [formEnd, setFormEnd] = useState("1100");
    const [formVenue, setFormVenue] = useState("");
    const [formWeeks, setFormWeeks] = useState<number[]>(WEEKS);
    const [formCheckOverlap, setFormCheckOverlap] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleWeekToggle = (week: number) => {
        setFormWeeks((prev) =>
            prev.includes(week)
                ? prev.filter((w) => w !== week)
                : [...prev, week].sort((a, b) => a - b)
        );
    };

    const handleCreateCustomSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true); // Debug: stop em from spamming insert

        try {
            if (!formName.trim()) return;
            if (parseInt(formEnd, 10) <= parseInt(formStart, 10)) {
                toast.error("Invalid Selection", {
                    description: "End time must be strictly after the start time.",
                });
                return;
            }
            if (formWeeks.length === 0) {
                toast.error("Invalid Selection", {
                    description: "Please select at least one week.",
                });
                return;
            }

            // format to allow comparison with NUSAPI's module names
            // but don't uppercase here, do it when comparing
            const normalizedName = formName.trim();

            if (!normalizedName) {
                toast.error("Missing Input", {
                    description: "Please enter a valid name for your custom activity.",
                });
                return;
            }

            // BLOCK ANY NAMES THAT MATCH AN EXISTING MODULE NUSAPI (Try catch if getModule fails)
            try {
                const matchingModule = await getModule(normalizedName.toUpperCase());
                if (matchingModule && matchingModule.moduleCode) {
                    toast.error("Name conflicts with an existing module", {
                        description: `"${normalizedName}" already exists as an official module.`,
                    });
                    return;
                }
            } catch (error) {
                console.error("Failed to validate module name compatibility:", error);
            }

            const computedBitmask = weeksToBitmask(formWeeks);

            await onCustomEvent({
                name: normalizedName,
                day: formDay,
                startTime: formStart,
                endTime: formEnd,
                venue: formVenue,
                selectedWeeks: formWeeks,
                weekBitmask: computedBitmask,
                classNo: formCheckOverlap ? "CUSTOM" : "CUSTOM_IGNORE_FLAG",
            });

            setIsDialogOpen(false);
            setFormName("");
            setFormVenue("");
            setFormWeeks(WEEKS);
            setFormCheckOverlap(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button
                    size="icon"
                    className="h-12 w-12 rounded-full bg-[#56A58B] hover:bg-[#458570] text-white shadow-lg cursor-pointer transition-transform duration-200 hover:scale-105"
                >
                    <Plus className="h-6 w-6" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Customizable Block Creator</DialogTitle>
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
                                value={formEnd}
                                onChange={(e) => setFormEnd(e.target.value)}
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

                    {/* Multi-Week Selection */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label>Weeks</Label>
                            <span className="text-xs font-semibold text-[#56A58B] bg-[#56A58B]/10 px-2 py-0.5 rounded-md">
                                {formatWeeksDisplay(formWeeks)}
                            </span>
                        </div>
                        <div className="grid grid-cols-5 gap-2 p-3 border border-border rounded-lg bg-muted/20">
                            {WEEKS.map((w) => (
                                <div key={w} className="flex items-center space-x-1.5">
                                    <Checkbox
                                        id={`week-${w}`}
                                        checked={formWeeks.includes(w)}
                                        onCheckedChange={() => handleWeekToggle(w)}
                                    />
                                    <label
                                        htmlFor={`week-${w}`}
                                        className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none"
                                    >
                                        W{w}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Flag Enabler/Disabler */}
                    <div className="flex items-start space-x-2 pt-2 border-t border-border/60">
                        <input
                            type="checkbox"
                            id="custom-overlap"
                            checked={formCheckOverlap}
                            onChange={(e) => setFormCheckOverlap(e.target.checked)}
                            className="h-4 w-4 mt-0.5 rounded border-input text-[#56A58B] focus:ring-[#56A58B] accent-[#56A58B] cursor-pointer"
                        />
                        <div className="grid gap-1 leading-none">
                            <label
                                htmlFor="custom-overlap"
                                className="text-xs font-semibold cursor-pointer select-none text-foreground"
                            >
                                Flag if clashing schedule?
                            </label>
                            <p className="text-[11px] text-muted-foreground select-none leading-normal">
                                Turn this on if you want to be notified of clashes.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-[#749c83] hover:bg-[#638570] text-white"
                        >
                            Insert into Schedule
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
