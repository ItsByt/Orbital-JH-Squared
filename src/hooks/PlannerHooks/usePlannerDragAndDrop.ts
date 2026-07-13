import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DragUpdate, DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";

import { PlannerModule } from "@/types";
import { usePlannerStore } from "@/store/usePlannerStore";
import { massUpdatePlannerModuleDB } from "@/services/plannerDB";
import { parseSemesterKey, isUnvalidatedSemesterKey } from "@/utils/plannerUtils/semesterKeyUtils";
import { checkValidSemesterUsingPlannerModule } from "@/utils/plannerUtils/validateModuleSemester";
import { getErrorMessage } from "@/utils/generalUtils/getErrorMessage";

interface MoveModuleVariables {
    fromKey: string;
    toKey: string;
    updatedBoard: Record<string, PlannerModule[]>;
    boardSnapshot: Record<string, PlannerModule[]>;
}

export function usePlannerDragAndDrop() {
    const queryClient = useQueryClient();

    const board = usePlannerStore((state) => state.board);
    const setBoard = usePlannerStore((state) => state.setBoard);
    const setDragState = usePlannerStore((state) => state.setDragState);
    const moveModule = usePlannerStore((state) => state.moveModule);

    const moveModuleMutation = useMutation<
        void, // Return type of mutationFn
        Error, // Type of error
        MoveModuleVariables // Type of the variables passed into .mutate()
    >({
        mutationFn: async ({ fromKey, toKey, updatedBoard }) => {
            const dbUpdates = [];

            const { year: toYear, semester: toSem } = parseSemesterKey(toKey);
            const updatedToSem = massUpdatePlannerModuleDB(updatedBoard[toKey], toYear, toSem);
            dbUpdates.push(updatedToSem);

            // If the columns are the same, the previous update already suffices
            if (fromKey !== toKey) {
                const { year: fromYear, semester: fromSem } = parseSemesterKey(fromKey);
                const updatedFromSem = massUpdatePlannerModuleDB(
                    updatedBoard[fromKey],
                    fromYear,
                    fromSem
                );
                dbUpdates.push(updatedFromSem);

                await Promise.all(dbUpdates);
            }
        },
        onError: (error, variables) => {
            setBoard(variables.boardSnapshot);
            toast.error("Failed to move module.", {
                description: getErrorMessage(error),
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["plannerBoard"] });
        },
    });

    // Handle while-dragging updates
    const handleDragUpdate = (update: DragUpdate) => {
        const { draggableId, destination } = update;
        if (!destination || isUnvalidatedSemesterKey(destination.droppableId)) {
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
        const { semester: toSem } = parseSemesterKey(toKey);
        if (!isUnvalidatedSemesterKey(toKey)) {
            const isValidSemester = checkValidSemesterUsingPlannerModule(draggedModule, toSem);
            if (!isValidSemester) {
                toast.error(`${draggedModule.moduleCode} is not available in this semester!`);
                return;
            }
        }

        // Optimistic update of module
        moveModule(fromKey, toKey, fromIndex, toIndex);
        const updatedBoard = usePlannerStore.getState().board;

        moveModuleMutation.mutate({
            fromKey,
            toKey,
            updatedBoard,
            boardSnapshot,
        });
    };

    return { handleDragUpdate, handleDragEnd };
}
