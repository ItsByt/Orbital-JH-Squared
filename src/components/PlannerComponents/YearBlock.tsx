import { useMemo } from "react";
import { Plus } from "lucide-react";
import SemesterColumn from "./SemesterColumn";
import { usePlannerStore } from "@/store/usePlannerStore";
import {
    SEMESTER_CODES,
    REVERSE_SEMESTER_CODE_MAP,
    SEMESTER_CODE_MAP,
    isExemptionKey,
    parseSemesterKey,
} from "@/utils/plannerUtils/semesterKeyUtils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { calculateStatistics } from "@/utils/plannerUtils/gpaCalculator";

interface YearBlockProps {
    yearNum: number;
}

export default function YearBlock({ yearNum }: YearBlockProps) {
    const board = usePlannerStore((state) => state.board);

    const visibleCustomColumns = usePlannerStore((state) => state.visibleCustomColumns);
    const showCustomColumn = usePlannerStore((state) => state.showCustomColumn);

    const SEMESTER_1 = REVERSE_SEMESTER_CODE_MAP[SEMESTER_CODES.SEM_1];
    const SEMESTER_2 = REVERSE_SEMESTER_CODE_MAP[SEMESTER_CODES.SEM_2];
    const WINTER_BREAK = REVERSE_SEMESTER_CODE_MAP[SEMESTER_CODES.WINTER_BREAK];
    const SPECIAL_TERM_1 = REVERSE_SEMESTER_CODE_MAP[SEMESTER_CODES.SPECIAL_TERM_1];
    const SPECIAL_TERM_2 = REVERSE_SEMESTER_CODE_MAP[SEMESTER_CODES.SPECIAL_TERM_2];
    const SUMMER_BREAK = REVERSE_SEMESTER_CODE_MAP[SEMESTER_CODES.SUMMER_BREAK];

    // Calculate Totals and Stats for a specific year
    const { yearTotals, stats } = useMemo(() => {
        const suffixes = Object.keys(SEMESTER_CODE_MAP);
        const yearModules = suffixes.flatMap((suffix) => board[`Y${yearNum}${suffix}`] || []);

        return {
            yearTotals: {
                count: yearModules.length,
                units: yearModules.reduce((sum, mod) => sum + mod.moduleCredit, 0),
            },
            stats: calculateStatistics(yearModules), // Get S/U for this year
        };
    }, [board, yearNum]);

    const progressiveStats = useMemo(() => {
        const allProgressiveModules = Object.entries(board).flatMap(([key, semModules]) => {
            // Progressive Stats include Exemptions
            if (isExemptionKey(key)) return semModules;

            try {
                const { year } = parseSemesterKey(key);
                if (year <= yearNum) return semModules;
            } catch (error) {
                // Skips any keys that are somehow unparseable
                console.log(error);
            }
            return [];
        });

        return calculateStatistics(allProgressiveModules);
    }, [board, yearNum]);

    const isVisible = (suffix: string) => visibleCustomColumns.includes(`Y${yearNum}${suffix}`);

    // Figure out which custom terms are NOT currently visible
    const hiddenCustomTerms = [
        { key: WINTER_BREAK, label: "Winter Break" },
        { key: SPECIAL_TERM_1, label: "Special Term I" },
        { key: SPECIAL_TERM_2, label: "Special Term II" },
        { key: SUMMER_BREAK, label: "Summer Break" },
    ].filter((term) => !isVisible(term.key));

    // Alternating colors for alternate years
    const bgColor =
        yearNum % 2 !== 0 ? "bg-white dark:bg-[#18181a]" : "bg-zinc-50 dark:bg-[#1e1e20]";

    return (
        <div
            className={`flex-shrink-0 w-max min-w-[500px] ${bgColor} rounded-xl p-5 flex flex-col snap-start shadow-md h-max border border-zinc-200 dark:border-zinc-800 relative`}
        >
            {/* Header: Year Info & Totals */}
            <div className="flex justify-between items-start mb-6 px-1">
                <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                        Year {yearNum}
                    </h2>
                </div>

                <div className="flex flex-col items-end gap-1">
                    {/* Top line: Year Load + S/U Count */}
                    <div className="text-right text-[13px] text-zinc-500 dark:text-zinc-400 font-medium leading-tight">
                        <span>
                            {yearTotals.count} Courses / {yearTotals.units} Units
                        </span>

                        {/* Show S/U only if used this year */}
                        {stats.suUsedCount > 0 && (
                            <>
                                <span className="mx-1.5">•</span>
                                <span className="text-amber-500 font-bold">
                                    {stats.suUsedCount} S/U
                                </span>
                            </>
                        )}
                    </div>

                    {/* Bottom line: Progressive GPA */}
                    {progressiveStats.gpa !== null && (
                        <div className="text-right text-[13px] font-bold text-[#56A58B] tracking-wide">
                            Cumulative GPA: {progressiveStats.gpa.toFixed(2)}
                        </div>
                    )}

                    {/* Adding Special Terms */}
                    {hiddenCustomTerms.length > 0 && (
                        <div className="mt-2.5">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white border border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 bg-zinc-100/50 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded px-2.5 py-1.5 transition-all">
                                        <Plus size={14} className="mr-1" /> Add Special Term
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="bg-white dark:bg-[#18181a] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                                >
                                    {hiddenCustomTerms.map((term) => (
                                        <DropdownMenuItem
                                            key={term.key}
                                            onClick={() =>
                                                showCustomColumn(`Y${yearNum}${term.key}`)
                                            }
                                            className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                        >
                                            Add {term.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-4 items-stretch flex-1 px-1">
                {/* Semester Columns for Semester 1 and Winter Break*/}
                <SemesterColumn title={`Semester 1`} semesterKey={`Y${yearNum}${SEMESTER_1}`} />

                {isVisible(WINTER_BREAK) && (
                    <SemesterColumn
                        title="Winter Break"
                        semesterKey={`Y${yearNum}${WINTER_BREAK}`}
                        isCustom
                    />
                )}

                {/* Semester Columns for Semester 2, Special Terms 1 and 2, and Summer Break */}
                <SemesterColumn title={`Semester 2`} semesterKey={`Y${yearNum}${SEMESTER_2}`} />

                {isVisible(SPECIAL_TERM_1) && (
                    <SemesterColumn
                        title="Special Term I"
                        semesterKey={`Y${yearNum}${SPECIAL_TERM_1}`}
                        isCustom
                    />
                )}
                {isVisible(SPECIAL_TERM_2) && (
                    <SemesterColumn
                        title="Special Term II"
                        semesterKey={`Y${yearNum}${SPECIAL_TERM_2}`}
                        isCustom
                    />
                )}
                {isVisible(SUMMER_BREAK) && (
                    <SemesterColumn
                        title="Summer Break"
                        semesterKey={`Y${yearNum}${SUMMER_BREAK}`}
                        isCustom
                    />
                )}
            </div>
        </div>
    );
}
