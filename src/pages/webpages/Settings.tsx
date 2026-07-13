import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Monitor, LogOut, Loader2 } from "lucide-react";
import { supabase } from "@/services/supabase";
import { getErrorMessage } from "@/utils/generalUtils/getErrorMessage";
import { toast } from "sonner";
import { usePlannerStore } from "@/store/usePlannerStore";
import { useSettingsStore, FontSizePairing, FontFamilyOption } from "@/store/useSettingsStore";

export default function Settings() {
    const queryClient = useQueryClient();
    const { theme, setTheme } = useTheme();

    const {
        startHour,
        endHour,
        cardFontSize,
        cardFontFamily,
        isSyncing,
        setTimeRange,
        setCardFontSize,
        setCardFontFamily,
        resetSettings
    } = useSettingsStore();

    async function handleLogOut() {
        const { error: signOutError } = await supabase.auth.signOut();

        if (signOutError) {
            toast.error("Log Out Failed", { description: getErrorMessage(signOutError) });
            return;
        }

        queryClient.clear();
        usePlannerStore.getState().resetStore();
        resetSettings();
        toast.success("Logged Out Successfully!");
    }

    // Generate hour options (05:00 to 24:00)
    const availableStartHours = Array.from({ length: 16 }, (_, i) => i + 5); // 5 to 20
    const availableEndHours = Array.from({ length: 15 }, (_, i) => i + 10); // 10 to 24

    return (
        <div className="w-full min-h-screen flex flex-col items-start justify-start pt-1 px-6 pb-6 space-y-4 bg-background text-foreground">
            <div className="flex items-center justify-between w-full">
                <h1
                    className="text-4xl font-bold"
                    style={{
                        fontFamily: "Bahnschrift, sans-serif",
                        color: "#56A58B",
                    }}
                >
                    Settings
                </h1>
                {isSyncing && (
                    <div className="flex items-center text-xs text-muted-foreground gap-1.5 animate-pulse">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving changes...
                    </div>
                )}
            </div>

            {/* Theme Toggling */}
            <div className="w-full bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
                <div className="space-y-1.5">
                    <h2 className="text-xl font-semibold leading-none tracking-tight" style={{ fontFamily: "Bahnschrift, sans-serif" }}>
                        Theme Toggle
                    </h2>
                    <p className="text-sm text-muted-foreground">Toggle the brightness of page displays.</p>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2">
                    <Button variant={theme === "light" ? "default" : "outline"} className="w-full flex items-center justify-center gap-2 h-12" onClick={() => setTheme("light")}>
                        <Sun className="h-4 w-4" /> Light
                    </Button>
                    <Button variant={theme === "dark" ? "default" : "outline"} className="w-full flex items-center justify-center gap-2 h-12" onClick={() => setTheme("dark")}>
                        <Moon className="h-4 w-4" /> Dark
                    </Button>
                    <Button variant={theme === "system" ? "default" : "outline"} className="w-full flex items-center justify-center gap-2 h-12" onClick={() => setTheme("system")}>
                        <Monitor className="h-4 w-4" /> System
                    </Button>
                </div>
            </div>

            {/* Timetable Range Dropdowns */}
            <div className="w-full bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
                <div className="space-y-1.5">
                    <h2 className="text-xl font-semibold leading-none tracking-tight text-destructive" style={{ fontFamily: "Bahnschrift, sans-serif" }}>
                        Timetable Grid Scale
                    </h2>
                    <p className="text-sm text-muted-foreground">Select start and end hours of the Timetable.</p>
                    <p className="text-sm text-muted-foreground">Note: Lessons cut off by timing will not be displayed.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Start Time</label>
                        <select
                            value={startHour}
                            onChange={(e) => {
                                const newStart = Number(e.target.value);
                                // If new start is >= current end, automatically push end hour 2 hours later
                                const newEnd = newStart >= endHour ? Math.min(newStart + 2, 24) : endHour;
                                setTimeRange(newStart, newEnd);
                            }}
                            className="w-full h-11 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                            {availableStartHours.map((hour) => (
                                <option key={hour} value={hour}>
                                    {hour.toString().padStart(2, "0")}:00
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">End Time</label>
                        <select
                            value={endHour}
                            onChange={(e) => setTimeRange(startHour, Number(e.target.value))}
                            className="w-full h-11 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                            {availableEndHours
                                .filter((hour) => hour > startHour) // Only show hours strictly after the start time
                                .map((hour) => (
                                    <option key={hour} value={hour}>
                                        {hour === 24 ? "24:00 (Midnight)" : `${hour.toString().padStart(2, "0")}:00`}
                                    </option>
                                ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Typography Customization */}
            <div className="w-full bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
                <div className="space-y-1.5">
                    <h2 className="text-xl font-semibold leading-none tracking-tight text-destructive" style={{ fontFamily: "Bahnschrift, sans-serif" }}>
                        Font Styling
                    </h2>
                    <p className="text-sm text-muted-foreground">Customize card font scaling and type.</p>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold">Font Size Preset</label>
                    <div className="grid grid-cols-3 gap-4">
                        {(["small", "regular", "large"] as FontSizePairing[]).map((size) => (
                            <Button
                                key={size}
                                variant={cardFontSize === size ? "default" : "outline"}
                                className="w-full h-11 capitalize"
                                onClick={() => setCardFontSize(size)}
                            >
                                {size}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold">Font Family</label>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { id: "sans", label: "Sans (Geist)", style: "font-sans" },
                            { id: "mono", label: "Monospace", style: "font-mono" },
                            { id: "bahnschrift", label: "Bahnschrift", style: "font-['Bahnschrift']" },
                            { id: "atkinson", label: "Atkinson", style: "font-atkinson" },
                            { id: "inter", label: "Inter", style: "font-inter" },
                            { id: "lexend", label: "Lexend", style: "font-lexend" },
                        ].map((font) => (
                            <Button
                                key={font.id}
                                variant={cardFontFamily === font.id ? "default" : "outline"}
                                className={`w-full h-11 ${font.style}`}
                                onClick={() => setCardFontFamily(font.id as FontFamilyOption)}
                            >
                                {font.label}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Account Management */}
            <div className="w-full bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
                <div className="space-y-1.5">
                    <h2 className="text-xl font-semibold leading-none tracking-tight text-destructive" style={{ fontFamily: "Bahnschrift, sans-serif" }}>
                        Account Management
                    </h2>
                    <p className="text-sm text-muted-foreground">Manage your active session across devices.</p>
                </div>
                <div className="pt-2">
                    <Button variant="destructive" className="w-full sm:w-auto flex items-center justify-center gap-2 h-11 px-8" onClick={handleLogOut}>
                        <LogOut className="h-4 w-4" /> Log Out
                    </Button>
                </div>
            </div>
        </div>
    );
}