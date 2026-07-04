import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Monitor } from "lucide-react";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="absolute top-6 right-6 flex items-center gap-1 bg-card p-1 border border-border rounded-full shadow-sm z-50">
            <Button
                variant={theme === "light" ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setTheme("light")}
                title="Light Mode"
            >
                <Sun className="h-4 w-4" />
            </Button>

            <Button
                variant={theme === "dark" ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setTheme("dark")}
                title="Dark Mode"
            >
                <Moon className="h-4 w-4" />
            </Button>

            <Button
                variant={theme === "system" ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setTheme("system")}
                title="System Default"
            >
                <Monitor className="h-4 w-4" />
            </Button>
        </div>
    );
}
