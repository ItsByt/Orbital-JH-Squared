import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { DragDropContext, type DragUpdate, type DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";

import { TOTAL_PLANNER_YEARS } from "@/config/constants";
import YearBlock from "@/components/PlannerPage/YearBlock";
import ExemptionRow from "@/components/PlannerPage/ExemptionRow";
import { usePlannerStore } from "@/store/usePlannerStore";
import { formatPlannerBoard } from "@/utils/plannerUtils/plannerFormatters";
import { checkValidSemesterUsingPlannerModule } from "@/utils/plannerUtils/validateModuleSemester";
import { getPlannerModules, massUpdatePlannerModulesDB } from "@/services/plannerDB";
import {
    isUnvalidatedSemester,
    parseSemesterKey,
    EXEMPTION_KEY,
} from "@/utils/plannerUtils/semesterKeyUtils";
import { getErrorMessage } from "@/utils/generalUtils/getErrorMessage";

const YEARS = Array.from({ length: TOTAL_PLANNER_YEARS }, (_, i) => i + 1);

export default function Planner() {
    const board = usePlannerStore((state) => state.board);
    const setBoard = usePlannerStore((state) => state.setBoard);
    const setDragState = usePlannerStore((state) => state.setDragState);
    const moveModule = usePlannerStore((state) => state.moveModule);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadBoard() {
            try {
                const rows = await getPlannerModules();
                const formattedBoard = formatPlannerBoard(rows);
                setBoard(formattedBoard);
            } catch (error) {
                toast.error("Failed to load planner data", { description: getErrorMessage(error) });
            } finally {
                setIsLoading(false);
            }
        }
        loadBoard();
    }, [setBoard]);

    // Calculate and memoise Global Totals for the header
    const globalTotals = useMemo(() => {
        let count = 0;
        let units = 0;
        Object.entries(board).forEach(([key, sem]) => {
            sem.forEach((mod) => {
                if (key === EXEMPTION_KEY && mod.excludeFromTotal) return;
                count += 1;
                units += mod.moduleCredit;
            });
        });
        return { count, units };
    }, [board]);

    // Handle while-dragging updates
    const handleDragUpdate = (update: DragUpdate) => {
        const { draggableId, destination } = update;
        if (!destination || isUnvalidatedSemester(destination.droppableId)) {
            setDragState({ draggingModuleCode: draggableId, isOverInvalidSem: false });
            return;
        }

        // Check if module is dragged over invalid semester
        const { semester: toSem } = parseSemesterKey(destination.droppableId);
        const draggedModuleDetails = Object.values(board)
            .flat()
            .find((m) => m.moduleCode === draggableId);
        const isValidSemester = checkValidSemesterUsingPlannerModule(draggedModuleDetails, toSem);

        setDragState({ draggingModuleCode: draggableId, isOverInvalidSem: !isValidSemester });
    };

    // Handle end-of-drag updates
    const handleDragEnd = async (result: DropResult) => {
        setDragState({ draggingModuleCode: null, isOverInvalidSem: false });
        const { source, destination } = result;

        if (!destination) return;

        const fromKey = source.droppableId;
        const toKey = destination.droppableId;
        const fromIndex = source.index;
        const toIndex = destination.index;

        // No net movement
        if (fromKey === toKey && fromIndex === toIndex) return;

        // moveModule completely reassigns the arrays for the semesters involved,
        // so a shallow copy is sufficient
        const boardSnapshot = { ...usePlannerStore.getState().board };

        // Checking if new semester moved to is valid
        const draggedModule = boardSnapshot[fromKey][fromIndex];
        const { year: toYear, semester: toSem } = parseSemesterKey(toKey);
        if (!isUnvalidatedSemester(toKey)) {
            const isValidSemester = checkValidSemesterUsingPlannerModule(draggedModule, toSem);
            if (!isValidSemester) {
                toast.error(`${draggedModule.moduleCode} is not available in this semester!`);
                return;
            }
        }

        // Optimistic update of module
        moveModule(fromKey, toKey, fromIndex, toIndex);
        const updatedBoard = usePlannerStore.getState().board;

        try {
            const dbUpdates = [];
            const updatedToSem = massUpdatePlannerModulesDB(updatedBoard[toKey], toYear, toSem);
            dbUpdates.push(updatedToSem);

            // If the columns are the same, the previous update already suffices
            if (fromKey !== toKey) {
                const { year: fromYear, semester: fromSem } = parseSemesterKey(fromKey);
                const updatedFromSem = massUpdatePlannerModulesDB(updatedBoard[fromKey], fromYear, fromSem);
                dbUpdates.push(updatedFromSem);
            }

            await Promise.all(dbUpdates);
        } catch (error) {
            usePlannerStore.getState().setBoard(boardSnapshot);
            toast.error("Failed to move module. Restoring previous state.", {
                description: getErrorMessage(error),
            });
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
        // Also available to use: onDragStart
        // onDragEnd is the only one required
        <DragDropContext onDragEnd={handleDragEnd} onDragUpdate={handleDragUpdate}>
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

                <ExemptionRow />
            </div>
        </DragDropContext>
    );
}
