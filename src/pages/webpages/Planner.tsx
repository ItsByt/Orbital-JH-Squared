import { TOTAL_PLANNER_YEARS } from "@/config/constants";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import YearBlock from "@/components/PlannerPage/YearBlock";
import { usePlannerStore } from "@/store/usePlannerStore";
import { formatPlannerBoard } from "@/utils/plannerUtils/plannerFormatters";
import { getPlannerModules } from "@/services/plannerDB";

const YEARS = Array.from({ length: TOTAL_PLANNER_YEARS }, (_, i) => i + 1);

export default function Planner() {
    const board = usePlannerStore((state) => state.board);
    const setBoard = usePlannerStore((state) => state.setBoard);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadBoard() {
            const rows = await getPlannerModules();
            const formattedBoard = formatPlannerBoard(rows);
            setBoard(formattedBoard);
            setIsLoading(false);
        }

        loadBoard();
    }, [setBoard]);

    // Calculate and memoise Global Totals for the header
    const globalTotals = useMemo(() => {
        let count = 0;
        let units = 0;
        Object.values(board).forEach((sem) => {
            count += sem.length;
            units += sem.reduce((sum, m) => sum + m.moduleCredit, 0);
        });
        return { count, units };
    }, [board]);

    // Loading
    if (isLoading) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground transition-colors duration-200">
                <Loader2 className="h-10 w-10 animate-spin text-[#749c83]" />
                <span className="ml-3 mt-4 text-base font-medium text-muted-foreground">
                    Loading planner data...
                </span>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden space-y-4 pt-1 px-6 pb-2 w-full">
            <div className="flex justify-between items-end shrink-0 border-b border-border/50 pb-2">
                <h1
                    className="text-3xl font-bold tracking-tight"
                    style={{ fontFamily: "Bahnschrift, sans-serif", color: "#56A58B" }}
                >
                    Module Planner
                </h1>

                {/* Global Totals */}
                <div className="text-right text-xl uppercase tracking-wider text-zinc-400 font-bold">
                    <span className="text-zinc-200">{globalTotals.count}</span> Courses /{" "}
                    <span className="text-zinc-200">{globalTotals.units}</span> Units
                </div>
            </div>

            {/* Horizontal Scroll Container */}
            {/* flex-1 lets it fill the rest of the screen, overflow-x-auto enables the single scrollbar */}
            <div className="flex flex-1 overflow-x-auto overflow-y-hidden gap-4 pb-4 snap-x scrollbar-thin scrollbar-thumb-zinc-700">
                {YEARS.map((yearNum) => (
                    <YearBlock key={yearNum} yearNum={yearNum} />
                ))}
            </div>
        </div>
    );
}
