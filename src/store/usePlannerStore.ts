import { create } from "zustand";
import type { PlannerModule } from "@/types";
import { generateEmptyBoard } from "@/utils/plannerUtils/plannerFormatters";

interface PlannerState {
    //board key format: "Y1S1"
    board: Record<string, PlannerModule[]>;

    setBoard: (board: Record<string, PlannerModule[]>) => void;
    setSemesterData: (semesterKey: string, modules: PlannerModule[]) => void;
    addModule: (semesterKey: string, module: PlannerModule) => void;
    removeModule: (semesterKey: string, moduleId: string) => void;
    moveModule: (fromSem: string, toSem: string, fromIndex: number, toIndex: number) => void;
}

export const usePlannerStore = create<PlannerState>((set) => ({
    board: generateEmptyBoard(),

    setBoard: (board) => set({ board }),

    setSemesterData: (semesterKey, modules) =>
        set((state) => ({
            board: { ...state.board, [semesterKey]: modules },
        })),

    addModule: (semesterKey, module) =>
        set((state) => ({
            board: {
                ...state.board,
                [semesterKey]: [...state.board[semesterKey], module],
            },
        })),

    removeModule: (semesterKey, moduleCode) =>
        set((state) => ({
            board: {
                ...state.board,
                [semesterKey]: state.board[semesterKey].filter(
                    (mod) => mod.moduleCode !== moduleCode
                ),
            },
        })),

    // moveModule completely reassigns the arrays for the semesters involved
    moveModule: (fromSem, toSem, fromIndex, toIndex) =>
        set((state) => {
            const newBoard = { ...state.board };
            const sourceColumn = [...newBoard[fromSem]];
            const destColumn = fromSem === toSem ? sourceColumn : [...newBoard[toSem]];

            const [movedModule] = sourceColumn.splice(fromIndex, 1);
            destColumn.splice(toIndex, 0, movedModule);

            // Update the displayOrder for every module in these columns
            sourceColumn.forEach((mod, index) => (mod.displayOrder = index));
            destColumn.forEach((mod, index) => (mod.displayOrder = index));

            newBoard[fromSem] = sourceColumn;
            newBoard[toSem] = destColumn;
            return { board: newBoard };
        }),
}));
