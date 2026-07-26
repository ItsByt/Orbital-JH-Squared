import { Loader2, ChevronDown, X } from "lucide-react";
import { AVAILABLE_GRADES } from "@/config/grades";
import { useUpdateModuleGrade } from "@/hooks/PlannerHooks/useUpdateModuleGrade";

import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GradeSelectorProps {
    semesterKey: string;
    moduleCode: string;
    currentGrade?: string;
}

export default function GradeSelector({
    semesterKey,
    moduleCode,
    currentGrade,
}: GradeSelectorProps) {
    const { mutate, isPending } = useUpdateModuleGrade();

    const handleGradeChange = (newGrade: string | undefined) => {
        if (newGrade === currentGrade) return;
        mutate({
            semesterKey,
            moduleCode,
            grade: newGrade,
            previousGrade: currentGrade, // passed along for rollback on error
        });
    };

    return (
        // stopPropagation prevents this click from bubbling up
        // and accidentally triggering Focus Mode or Drag-and-Drop
        <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        data-testid={`grade-selector-trigger-${moduleCode}`}
                        disabled={isPending}
                        className={cn(
                            "flex items-center gap-1 bg-black/20 hover:bg-black/30 border border-white/10",
                            "text-[10px] font-bold text-white rounded-md px-2 py-0.5",
                            "focus:outline-none focus:ring-1 focus:ring-white/50 transition-colors",
                            "disabled:opacity-50 cursor-pointer"
                        )}
                    >
                        <span>{currentGrade ?? "Grade"}</span>
                        {isPending ? (
                            <Loader2 className="h-2.5 w-2.5 animate-spin opacity-70" />
                        ) : (
                            <ChevronDown className="h-2.5 w-2.5 opacity-70" />
                        )}
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    align="end"
                    className="w-40 p-2 bg-background border-border shadow-xl"
                >
                    {/* The Grade Grid */}
                    <div className="grid grid-cols-3 gap-1">
                        {AVAILABLE_GRADES.map((grade) => (
                            <DropdownMenuItem
                                key={grade}
                                data-testid={`grade-option-${grade}-${moduleCode}`}
                                onClick={() => handleGradeChange(grade)}
                                className={cn(
                                    "flex justify-center text-xs font-bold cursor-pointer rounded-sm py-1.5",
                                    currentGrade === grade
                                        ? "bg-[#56A58B]/20 text-[#56A58B]"
                                        : "text-foreground"
                                )}
                            >
                                {grade}
                            </DropdownMenuItem>
                        ))}
                    </div>

                    {/* Divider and Clear Option */}
                    <div className="h-px bg-border my-1.5" />

                    <DropdownMenuItem
                        data-testid={`grade-clear-${moduleCode}`}
                        onClick={() => handleGradeChange(undefined)}
                        className="flex justify-center text-xs text-muted-foreground hover:text-red-400 focus:text-red-400 cursor-pointer py-1.5"
                    >
                        <X className="h-3 w-3 mr-1.5" />
                        Clear Grade
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
