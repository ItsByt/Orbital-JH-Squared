import { useState } from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { formatWeeksDisplay } from "@/utils/timetableUtils/weekFormat";
import SearchBar from "@/components/GeneralComponents/SearchBar";
import type { DisplayLesson } from "@/types";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PRESET_COLORS = ["#56A58B", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#64748b"];

interface ActiveContainerProps {
    uniqueActiveModules: DisplayLesson[];
    customNameCounts: Record<string, number>;
    handleAddModule: (moduleCode: string, uniqueModules: DisplayLesson[]) => Promise<void>;
    handleRemoveModule: (moduleCode: string, id?: string, lessonType?: string) => void;
    handleUpdateColor: (moduleCode: string, color: string) => void;
    semester: number;
}

export default function ActiveContainer({
    uniqueActiveModules,
    customNameCounts,
    handleAddModule,
    handleRemoveModule,
    handleUpdateColor,
    semester
}: ActiveContainerProps) {
    const [searchResetKey, setSearchResetKey] = useState(0);

    const handleAddWithReset = async (moduleCode: string) => {
        await handleAddModule(moduleCode, uniqueActiveModules);
        setSearchResetKey((k) => k + 1);
    };

    return (
        <div className="w-full max-w-4xl mx-auto mt-6 space-y-4 pb-10">
            <SearchBar
                key={searchResetKey}
                onSelect={handleAddWithReset}
                targetSemester={semester}
            />

            {uniqueActiveModules.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm md:text-base font-semibold text-muted-foreground">
                        Active Modules ({uniqueActiveModules.length})
                    </h3>
                    <div className="flex flex-wrap gap-2.5 items-center">
                        {uniqueActiveModules.map((mod) => {
                            const isCustom = mod.lessonType === "Personal Block";
                            const hasDuplicateName =
                                isCustom && customNameCounts[mod.moduleCode.toUpperCase()] > 1;

                            return (
                                <div
                                    key={mod.id || mod.moduleCode}
                                    className="flex items-center gap-3 bg-secondary text-secondary-foreground px-4 py-2 min-h-9 h-auto rounded-lg border border-border text-sm font-bold tracking-wide shadow-sm select-none"
                                >
                                    <span>{mod.moduleCode}</span>

                                    {hasDuplicateName && (
                                        <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-normal bg-muted/40 dark:bg-muted/20 px-1.5 py-0.5 rounded border border-border/20">
                                            <span className="text-[#56A58B] font-medium">
                                                {mod.day ? mod.day.slice(0, 3) : ""}
                                            </span>
                                            <span className="opacity-40">|</span>
                                            <span>
                                                {mod.startTime || "0000"}-{mod.endTime || "0000"}
                                            </span>
                                            <span className="opacity-40">|</span>
                                            <span className="text-amber-500 dark:text-amber-400/90 font-medium">
                                                {formatWeeksDisplay((mod.weeks || []).map(Number))}
                                            </span>
                                        </div>
                                    )}

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                className="text-muted-foreground hover:text-foreground rounded-full p-1 hover:bg-muted transition-colors cursor-pointer"
                                                aria-label={`Options for ${mod.moduleCode}`}
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </button>
                                        </DropdownMenuTrigger>

                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
                                                Module Color
                                            </DropdownMenuLabel>

                                            {/* Color Palette Grid */}
                                            <div className="flex flex-wrap gap-2 px-2 py-1.5">
                                                {PRESET_COLORS.map((color) => (
                                                    <button
                                                        key={color}
                                                        onClick={() =>
                                                            handleUpdateColor(mod.moduleCode, color)
                                                        }
                                                        className="h-6 w-6 rounded-full border border-black/10 cursor-pointer hover:scale-110 hover:ring-2 hover:ring-offset-1 transition-all"
                                                        style={{ backgroundColor: color }}
                                                        aria-label={`Set color to ${color}`}
                                                    />
                                                ))}
                                            </div>

                                            <DropdownMenuSeparator />

                                            {/* Remove Module */}
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    handleRemoveModule(
                                                        mod.moduleCode,
                                                        mod.id,
                                                        mod.lessonType
                                                    )
                                                }
                                                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                <span>Remove Module</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
