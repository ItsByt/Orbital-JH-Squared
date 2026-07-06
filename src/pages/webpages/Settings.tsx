import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Monitor, LogOut } from "lucide-react";
import { supabase } from "@/services/supabase";
import { getErrorMessage } from "@/utils/generalUtils/getErrorMessage";
import { toast } from "sonner";

export default function Settings() {
    const { theme, setTheme } = useTheme();

    async function handleLogOut() {
        const { error: signOutError } = await supabase.auth.signOut();

        if (signOutError) {
            toast.error("Log Out Failed", { description: getErrorMessage(signOutError) });
        } else {
            toast.success("Logged Out Successfully!");
        }
    }

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

            {/* Theme Toggling for Dark and Light Mode*/}
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
                    <p className="text-sm text-muted-foreground">
                        Toggle the brightness of page displays.
                    </p>
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

            {/* Account Management */}
            <div className="w-full bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
                <div className="space-y-1.5">
                    <h2
                        className="text-xl font-semibold leading-none tracking-tight text-destructive"
                        style={{ fontFamily: "Bahnschrift, sans-serif" }}
                    >
                        Account Management
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Manage your active session across devices.
                    </p>
                </div>

                <div className="pt-2">
                    <Button
                        variant="destructive"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 h-11 px-8"
                        onClick={handleLogOut}
                    >
                        <LogOut className="h-4 w-4" />
                        Log Out
                    </Button>
                </div>
            </div>
        </div>
    );
}
