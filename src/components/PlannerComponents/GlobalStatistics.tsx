import { useMemo } from "react";
import { GraduationCap, BookOpen, Stamp } from "lucide-react";
import { usePlannerStore } from "@/store/usePlannerStore";
import { calculateStatistics } from "@/utils/plannerUtils/gpaCalculator";
import { EXEMPTION_KEY } from "@/utils/plannerUtils/semesterKeyUtils";

export default function GlobalStatistics() {
    const board = usePlannerStore((state) => state.board);

    const stats = useMemo(() => {
        const allModules = Object.values(board).flat();

        // Calculating Total Planned (Everything on the board)
        let plannedUnits = 0;
        Object.entries(board).forEach(([key, sem]) => {
            sem.forEach((mod) => {
                if (key === EXEMPTION_KEY && mod.excludeFromTotal) return;
                plannedUnits += mod.moduleCredit;
            });
        });

        // Calculating Completed Stats
        const completedStats = calculateStatistics(allModules);

        return { ...completedStats, plannedUnits };
    }, [board]);

    return (
        <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 shadow-sm transition-colors">
            {/* GPA Display */}
            <div className="flex items-center gap-3 px-3">
                <div className="bg-[#56A58B]/15 dark:bg-[#56A58B]/20 p-2 rounded-md text-[#408069] dark:text-[#56A58B]">
                    <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 dark:text-zinc-500">
                        Cumulative GPA
                    </p>
                    <p
                        data-testid="global-gpa"
                        className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight"
                    >
                        {stats.gpa !== null ? stats.gpa.toFixed(2) : "0.00"}
                    </p>
                </div>
            </div>

            {/* Vertical Divider */}
            <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />

            {/* Units Display: Completed / Planned */}
            <div className="flex items-center gap-3 px-3">
                <div className="bg-blue-100 dark:bg-blue-500/10 p-2 rounded-md text-blue-600 dark:text-blue-400">
                    <BookOpen className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 dark:text-zinc-500">
                        Units (Completed / Planned)
                    </p>
                    <p
                        data-testid="global-units"
                        className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight"
                    >
                        {stats.totalCompletedUnits}
                        <span className="text-sm text-zinc-500 dark:text-zinc-500 ml-1">
                            / {stats.plannedUnits}
                        </span>
                    </p>
                </div>
            </div>

            {/* Vertical Divider */}
            <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />

            {/* SU Usage Display */}
            <div className="flex items-center gap-3 px-3">
                <div className="bg-amber-100 dark:bg-amber-500/10 p-2 rounded-md text-amber-600 dark:text-amber-500">
                    <Stamp className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 dark:text-zinc-500">
                        S/U Used
                    </p>
                    <p
                        data-testid="global-su-count"
                        className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight"
                    >
                        {stats.suUsedCount}
                    </p>
                </div>
            </div>
        </div>
    );
}
