import { useTheme } from "@/components/Theme";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Monitor } from "lucide-react";

export default function Settings() {
    // moved bulky code to theme.ts under components
    // use this to activate
    const { theme, setTheme } = useTheme();

    return (
        <div className="w-full min-h-screen flex flex-col items-start justify-start pt-1 px-6 pb-6 space-y-4 bg-background text-foreground">
            <div>
                <h1
                    className="text-4xl font-bold"
                    style={{
                        fontFamily: "Bahnschrift, sans-serif",
                        color: "#56A58B",
                    }}
                >
                    Settings
                </h1>
            </div>

            <div className="w-full bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
                <div className="space-y-1.5">
                    <h2
                        className="text-xl font-semibold leading-none tracking-tight"
                        style={{
                            fontFamily: "Bahnschrift, sans-serif",
                        }}
                    >
                        Theme Toggle
                    </h2>
                </div>

                {/* 3-Column Grid for Buttons */}
                <div className="grid grid-cols-3 gap-4 pt-2">
                    {/* Light Mode Button */}
                    <Button
                        variant={theme === "light" ? "default" : "outline"}
                        className="w-full flex items-center justify-center gap-2 h-12"
                        onClick={() => setTheme("light")}
                    >
                        <Sun className="h-4 w-4" />
                        Light
                    </Button>

                    {/* Dark Mode Button */}
                    <Button
                        variant={theme === "dark" ? "default" : "outline"}
                        className="w-full flex items-center justify-center gap-2 h-12"
                        onClick={() => setTheme("dark")}
                    >
                        <Moon className="h-4 w-4" />
                        Dark
                    </Button>

                    {/* System Button */}
                    <Button
                        variant={theme === "system" ? "default" : "outline"}
                        className="w-full flex items-center justify-center gap-2 h-12"
                        onClick={() => setTheme("system")}
                    >
                        <Monitor className="h-4 w-4" />
                        System
                    </Button>
                </div>
            </div>
        </div>
    );
}
