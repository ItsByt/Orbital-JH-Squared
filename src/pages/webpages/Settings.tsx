import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Monitor, LogOut, Loader2 } from "lucide-react";
import { useSettingsStore, FontFamilyOption } from "@/store/useSettingsStore";
import { SettingsSection } from "@/components/SettingsComponents/SettingsSection";
import { START_HOURS_SETTING, END_HOURS_SETTING, FONT_SIZES, FONT_FAMILIES } from "@/config/constants";
import { useLogout } from "@/hooks/GeneralHooks/useAccSettings";

export default function Settings() {
    const { theme, setTheme } = useTheme();
    const { logout } = useLogout();

    const {
        startHour,
        endHour,
        cardFontSize,
        cardFontFamily,
        isSyncing,
        setTimeRange,
        setCardFontSize,
        setCardFontFamily,
    } = useSettingsStore();

    return (
        <div className="w-full min-h-screen flex flex-col items-start justify-start pt-1 px-6 pb-6 space-y-4 bg-background text-foreground">
            {/* Page Header */}
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
            <SettingsSection
                title="Theme Toggle"
                description="Toggle the brightness of page displays."
            >
                <div className="grid grid-cols-3 gap-4">
                    <Button
                        variant={theme === "light" ? "default" : "outline"}
                        className="w-full flex items-center justify-center gap-2 h-12"
                        onClick={() => setTheme("light")}
                    >
                        <Sun className="h-4 w-4" /> Light
                    </Button>
                    <Button
                        variant={theme === "dark" ? "default" : "outline"}
                        className="w-full flex items-center justify-center gap-2 h-12"
                        onClick={() => setTheme("dark")}
                    >
                        <Moon className="h-4 w-4" /> Dark
                    </Button>
                    <Button
                        variant={theme === "system" ? "default" : "outline"}
                        className="w-full flex items-center justify-center gap-2 h-12"
                        onClick={() => setTheme("system")}
                    >
                        <Monitor className="h-4 w-4" /> System
                    </Button>
                </div>
            </SettingsSection>

            {/* Timetable Range Dropdowns */}
            <SettingsSection
                title="Timetable Grid Scale"
                titleClassName="text-destructive"
                description={[
                    "Select start and end hours of the Timetable.",
                    "Note: Lessons cut off by timing will not be displayed.",
                ]}
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Start Time</label>
                        <select
                            value={startHour}
                            onChange={(e) => {
                                const newStart = Number(e.target.value);
                                const newEnd = newStart >= endHour ? Math.min(newStart + 2, 24) : endHour;
                                setTimeRange(newStart, newEnd);
                            }}
                            className="w-full h-11 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                            {START_HOURS_SETTING.map((hour) => (
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
                            {END_HOURS_SETTING
                                .filter((hour) => hour > startHour)
                                .map((hour) => (
                                    <option key={hour} value={hour}>
                                        {hour === 24
                                            ? "24:00 (Midnight)"
                                            : `${hour.toString().padStart(2, "0")}:00`}
                                    </option>
                                ))}
                        </select>
                    </div>
                </div>
            </SettingsSection>

            {/* Typography Customization */}
            <SettingsSection
                title="Font Styling"
                description="Customize card font scaling and type."
                className="space-y-6"
            >
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Font Size Preset</label>
                        <div className="grid grid-cols-3 gap-4">
                            {FONT_SIZES.map((size) => (
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
                            {FONT_FAMILIES.map((font) => (
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
            </SettingsSection>

            {/* Account Management */}
            <SettingsSection
                title="Account Management"
                titleClassName="text-destructive"
                description="Manage your active session across devices."
            >
                <Button
                    variant="destructive"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 h-11 px-8"
                    onClick={logout}
                >
                    <LogOut className="h-4 w-4" /> Log Out
                </Button>
            </SettingsSection>
        </div>
    );
}