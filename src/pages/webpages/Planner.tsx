import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { TOTAL_PLANNER_YEARS } from "@/config/constants";
import YearBlock from "@/components/PlannerPage/YearBlock";
import { usePlannerStore } from "@/store/usePlannerStore";
import { formatPlannerBoard, parseSemesterKey } from "@/utils/plannerUtils/plannerFormatters";
import { getPlannerModules, massUpdatePlannerModulesDB } from "@/services/plannerDB";
import { checkValidSemesterUsingModuleCode } from "@/utils/generalUtils/validateModuleSemester";
import { toast } from "sonner";


const YEARS = Array.from({ length: TOTAL_PLANNER_YEARS }, (_, i) => i + 1);

export default function Planner() {
    const board = usePlannerStore((state) => state.board);
    const setBoard = usePlannerStore((state) => state.setBoard);
    const moveModule = usePlannerStore((state) => state.moveModule);
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

    const handleDragEnd = async (result: DropResult) => {
        const { source, destination } = result;

        if (!destination) return;

        const fromYearSem = source.droppableId;
        const toYearSem = destination.droppableId;
        const fromIndex = source.index;
        const toIndex = destination.index;

        // No net movement
        if (fromYearSem === toYearSem && fromIndex === toIndex) return;

        // moveModule completely reassigns the arrays for the semesters involved,
        // so a shallow copy is sufficient
        const boardSnapshot = { ...usePlannerStore.getState().board };

        // Checking if new semester moved to is valid
        const draggedModule = boardSnapshot[fromYearSem][fromIndex];
        const moduleCode = draggedModule.moduleCode
        const { year: toYear, semester: toSem } = parseSemesterKey(toYearSem);
        const isValidSemester = await checkValidSemesterUsingModuleCode(moduleCode, toSem);
        if (!isValidSemester) {
            toast.error(`${moduleCode} is not available in this semester!`);
            return
        }

        // Optimistic update of module
        moveModule(fromYearSem, toYearSem, fromIndex, toIndex);

        const updatedBoard = usePlannerStore.getState().board;

        const successInUpdatingDestColDB = await massUpdatePlannerModulesDB(
            updatedBoard[toYearSem],
            toYear,
            toSem
        );
        
        // If the columns are the same, the previous update already suffices
        let successInUpdatingSourceColDB = true;
        if (fromYearSem !== toYearSem) {
            const { year: fromYear, semester: fromSem } = parseSemesterKey(fromYearSem);
            successInUpdatingSourceColDB = await massUpdatePlannerModulesDB(
                updatedBoard[fromYearSem],
                fromYear,
                fromSem
            );
        }

        if (!successInUpdatingDestColDB || !successInUpdatingSourceColDB) {
            toast.error("Failed to move module. Restoring previous state.");
            console.log({ successInUpdatingDestColDB }, { successInUpdatingSourceColDB });
            usePlannerStore.getState().setBoard(boardSnapshot);
        }
    };

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
        // Also available to use: onDragStart and onDragUpdate
        // onDragEnd is the only one required
        <DragDropContext onDragEnd={handleDragEnd}>
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
        </DragDropContext>
    );
}
