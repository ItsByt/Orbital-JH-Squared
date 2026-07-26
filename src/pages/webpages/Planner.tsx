import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { DragDropContext } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";

import { TOTAL_PLANNER_YEARS } from "@/config/constants";
import YearBlock from "@/components/PlannerComponents/YearBlock";
import ExemptionRow from "@/components/PlannerComponents/ExemptionRow";
import { usePlannerStore } from "@/store/usePlannerStore";
import { formatPlannerBoard } from "@/utils/plannerUtils/plannerFormatters";
import { getPlannerModules } from "@/services/plannerDB";

import { FocusModeProvider, useFocusModeContext } from "@/context/FocusModeContext";
import { useDragScroll } from "@/hooks/PlannerHooks/useDragScroll";
import { usePlannerDragAndDrop } from "@/hooks/PlannerHooks/usePlannerDragAndDrop";
import GlobalStatistics from "@/components/PlannerComponents/GlobalStatistics";

const YEARS = Array.from({ length: TOTAL_PLANNER_YEARS }, (_, i) => i + 1);

function PlannerContent() {
    const { isFocusMode, toggleFocusMode } = useFocusModeContext();
    const dragState = usePlannerStore((state) => state.dragState);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    useDragScroll(scrollContainerRef, !!dragState.draggingModuleCode);

    return (
        <div className="flex flex-col flex-1 min-h-0 min-w-0 space-y-4 pt-1 px-6 pb-2 w-full">
            <div className="flex justify-between items-end shrink-0 border-b border-border/50 pb-2">
                <div className="flex items-center gap-6">
                    <h1
                        className="text-3xl font-bold tracking-tight"
                        style={{ fontFamily: "Bahnschrift, sans-serif", color: "#56A58B" }}
                    >
                        Module Planner
                    </h1>

                    {/* Toggle Button for Focus Mode*/}
                    <Button
                        data-testid="focus-mode-toggle"
                        variant={isFocusMode ? "default" : "outline"}
                        onClick={toggleFocusMode}
                        className={`flex items-center gap-2 h-9 transition-all ${
                            isFocusMode
                                ? "bg-[#56A58B] hover:bg-[#468973] text-white border-transparent"
                                : ""
                        }`}
                    >
                        {isFocusMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        {isFocusMode ? "Focus Mode: ON" : "Focus Mode"}
                    </Button>
                </div>
                <GlobalStatistics />
            </div>

            {/* Horizontal Scroll Container */}
            {/* flex-1 lets it fill the rest of the screen, overflow-x-auto enables the single scrollbar */}
            <div
                ref={scrollContainerRef}
                data-testid="planner-scroll-container"
                className="flex flex-1 overflow-x-auto gap-4 pb-4 scrollbar-thin scrollbar-thumb-zinc-700"
            >
                {YEARS.map((yearNum) => (
                    <YearBlock key={yearNum} yearNum={yearNum} />
                ))}
            </div>
            <ExemptionRow />
        </div>
    );
}

export default function Planner() {
    const setBoard = usePlannerStore((state) => state.setBoard);
    const { handleDragUpdate, handleDragEnd } = usePlannerDragAndDrop();

    // Loading the Planner Board
    const { isLoading } = useQuery({
        queryKey: ["plannerBoard"],
        queryFn: async () => {
            const rows = await getPlannerModules();
            const formattedBoard = formatPlannerBoard(rows);
            setBoard(formattedBoard);
            return formattedBoard;
        },
        staleTime: 1000 * 60 * 5,
    });

    // Loading
    if (isLoading) {
        return (
            <div
                data-testid="planner-loading-screen"
                className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground transition-colors duration-200"
            >
                <Loader2 className="h-10 w-10 animate-spin text-[#749c83]" />
                <span className="ml-3 mt-4 text-base font-medium text-muted-foreground">
                    Loading planner data...
                </span>
            </div>
        );
    }

    return (
        // Also available to use for DragDropContext: onDragStart
        // onDragEnd is the only one required
        <DragDropContext onDragEnd={handleDragEnd} onDragUpdate={handleDragUpdate}>
            <FocusModeProvider>
                <PlannerContent />
            </FocusModeProvider>
        </DragDropContext>
    );
}
