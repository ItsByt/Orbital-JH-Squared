import { useMemo } from "react";
import SemesterColumn from "./SemesterColumn";
import { usePlannerStore } from "@/store/usePlannerStore";

interface YearBlockProps {
    yearNum: number;
}

export default function YearBlock({ yearNum }: YearBlockProps) {
    const board = usePlannerStore((state) => state.board);
    const dragState = usePlannerStore((state) => state.dragState);

    // Calculate Totals for a specific year (Sem 1 + Sem 2)
    const yearTotals = useMemo(() => {
        const s1 = board[`Y${yearNum}S1`] || [];
        const s2 = board[`Y${yearNum}S2`] || [];
        const allModules = [...s1, ...s2];

        return {
            count: allModules.length,
            units: allModules.reduce((sum, m) => sum + m.moduleCredit, 0),
        };
    }, [board, yearNum]);

    // Alternating colors for alternate years
    const bgColor = yearNum % 2 !== 0 ? "bg-[#18181a]" : "bg-[#1e1e20]";

    return (
        <div
            className={`flex-shrink-0 w-[400px] ${bgColor} rounded-xl p-3.5 flex flex-col snap-start shadow-md h-full overflow-hidden`}
        >
            {/* Header: Year Info & Totals */}
            <div className="flex justify-between items-start mb-5 px-0.5">
                <div>
                    <h2 className="text-base font-bold text-zinc-100 leading-tight">
                        Year {yearNum}
                    </h2>
                </div>
                <div className="text-right text-[14px] text-zinc-500 font-semibold">
                    <p>{yearTotals.count} Courses</p>
                    <p>{yearTotals.units} Units</p>
                </div>
            </div>

            {/* Content: Two Semester Columns */}
            <div className="grid grid-cols-2 gap-3 flex-1 overflow-hidden">
                <SemesterColumn
                    title="Sem 1"
                    semesterKey={`Y${yearNum}S1`}
                    isInvalidDropTarget={dragState.isOverInvalidSem}
                />
                <SemesterColumn
                    title="Sem 2"
                    semesterKey={`Y${yearNum}S2`}
                    isInvalidDropTarget={dragState.isOverInvalidSem}
                />
            </div>
        </div>
    );
}
