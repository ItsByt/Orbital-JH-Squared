import { useMemo } from "react";
import YearBlock from "@/components/PlannerPage/YearBlock";
import { usePlannerStore } from "@/store/usePlannerStore";

const YEARS = [1, 2, 3, 4, 5];

export default function Planner() {
    const board = usePlannerStore((state) => state.board);

    // Calculate and memoise Global Totals for the header
    const globalTotals = useMemo(() => {
        let count = 0;
        let units = 0;
        Object.values(board).forEach(sem => {
            count += sem.length;
            units += sem.reduce((sum, m) => sum + m.moduleCredit, 0);
        });
        return { count, units };
    }, [board]);

    return (
        <div className="flex flex-col flex-1 min-h-0 space-y-4 pt-1 px-6 pb-2 w-full">
            
            <div className="flex justify-between items-end shrink-0 border-b border-border/50 pb-2">
                <h1
                    className="text-3xl font-bold tracking-tight"
                    style={{ fontFamily: "Bahnschrift, sans-serif", color: "#56A58B" }}
                >
                    Module Planner
                </h1>
                
                {/* Global Totals */}
                <div className="text-right text-xl uppercase tracking-wider text-zinc-400 font-bold">
                    <span className="text-zinc-200">{globalTotals.count}</span> Courses / <span className="text-zinc-200">{globalTotals.units}</span> Units
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
