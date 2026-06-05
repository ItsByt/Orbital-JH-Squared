import { create } from "zustand";
import type { PlannerModule } from "@/types";
import { generateEmptyBoard } from "@/utils/plannerUtils/plannerFormatters";

interface PlannerState {
    //board key format: "Y1S1"
    board: Record<string, PlannerModule[]>;

    setBoard: (board: Record<string, PlannerModule[]>) => void;
    addModule: (semesterKey: string, module: PlannerModule) => void;
    removeModule: (semesterKey: string, moduleId: string) => void;
    moveModule: (fromSem: string, toSem: string, moduleId: string) => void;
}

export const usePlannerStore = create<PlannerState>((set) => ({
    board: generateEmptyBoard(),

    setBoard: (board) => set({ board }),

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

    moveModule: (fromSem, toSem, moduleCode) =>
        set((state) => {
            const moduleToMove = state.board[fromSem].find((mod) => mod.moduleCode === moduleCode);
            if (!moduleToMove) return state;

            return {
                board: {
                    ...state.board,
                    [fromSem]: state.board[fromSem].filter((mod) => mod.moduleCode !== moduleCode),
                    [toSem]: [...state.board[toSem], moduleToMove],
                },
            };
        }),
}));
