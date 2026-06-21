import { useState } from "react";
import { X } from "lucide-react";
import { formatWeeksDisplay } from "@/utils/timetableUtils/weekFormat";
import SearchBar from "@/components/GeneralComponents/SearchBar";
import type { DisplayLesson } from "@/types";

interface ActiveContainerProps {
    uniqueActiveModules: DisplayLesson[];
    customNameCounts: Record<string, number>;
    handleAddModule: (moduleCode: string, uniqueModules: DisplayLesson[]) => Promise<void>;
    handleRemoveModule: (moduleCode: string, id?: string, lessonType?: string) => void;
}

export default function ActiveContainer({
    uniqueActiveModules,
    customNameCounts,
    handleAddModule,
    handleRemoveModule,
}: ActiveContainerProps) {
    const [searchResetKey, setSearchResetKey] = useState(0);

    const handleAddWithReset = async (moduleCode: string) => {
        await handleAddModule(moduleCode, uniqueActiveModules);
        setSearchResetKey((k) => k + 1);
    };

    return (
        <div className="w-full max-w-4xl mx-auto mt-6 space-y-4 pb-10">
            <SearchBar key={searchResetKey} onSelect={handleAddWithReset} />

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

                                    <button
                                        onClick={() =>
                                            handleRemoveModule(
                                                mod.moduleCode,
                                                mod.id,
                                                mod.lessonType
                                            )
                                        }
                                        className="text-muted-foreground hover:text-destructive rounded-full p-1 hover:bg-muted transition-colors cursor-pointer"
                                        aria-label={`Remove ${mod.moduleCode}`}
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
