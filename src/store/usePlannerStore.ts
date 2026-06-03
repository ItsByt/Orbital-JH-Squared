import { create } from "zustand";
import type { PlannerModule } from "@/types";

interface PlannerState {
    //board key format: "Y1S1"
    board: Record<string, PlannerModule[]>;

    addModule: (semesterKey: string, module: PlannerModule) => void;
    removeModule: (semesterKey: string, moduleId: string) => void;
    moveModule: (fromSem: string, toSem: string, moduleId: string) => void;
}

export const usePlannerStore = create<PlannerState>((set) => ({
    board: {
        "Y1S1": [], "Y1S2": [],
        "Y2S1": [], "Y2S2": [],
        "Y3S1": [], "Y3S2": [],
        "Y4S1": [], "Y4S2": [],
        "Y5S1": [], "Y5S2": [],
    },

    addModule: (semesterKey, module) => set((state) => ({
        board: {
            ...state.board,
            [semesterKey]: [...state.board[semesterKey], module]
        }
    })),

    removeModule: (semesterKey, moduleCode) => set((state) => ({
        board: {
            ...state.board,
            [semesterKey]: state.board[semesterKey].filter(mod => mod.moduleCode !== moduleCode)
        }
    })),

    moveModule: (fromSem, toSem, moduleCode) => set((state) => {
        const moduleToMove = state.board[fromSem].find(mod => mod.moduleCode === moduleCode);
        if (!moduleToMove) return state;
        
        return {
            board: {
                ...state.board,
                [fromSem]: state.board[fromSem].filter(mod => mod.moduleCode !== moduleCode),
                [toSem]: [...state.board[toSem], moduleToMove]
            }
        };
    }),

}));

