import { create } from "zustand";
import type { PlannerModule } from "@/types";
import { generateEmptyBoard } from "@/utils/plannerUtils/plannerFormatters";
import { isExemptionKey, isCustomSemesterKey } from "@/utils/plannerUtils/semesterKeyUtils";

interface PlannerState {
    // board key format: "Y1S1"
    board: Record<string, PlannerModule[]>;
    dragState: { draggingModuleCode: string | null; isOverInvalidSem: boolean };
    visibleCustomColumns: string[];

    setBoard: (board: Record<string, PlannerModule[]>) => void;
    setDragState: (state: { draggingModuleCode: string | null; isOverInvalidSem: boolean }) => void;
    setSemesterData: (semesterKey: string, modules: PlannerModule[]) => void;

    addModule: (semesterKey: string, module: PlannerModule) => void;
    removeModule: (semesterKey: string, moduleId: string) => void;
    moveModule: (fromSem: string, toSem: string, fromIndex: number, toIndex: number) => void;

    toggleExcludeFromTotal: (semesterKey: string, moduleCode: string) => void;
    showCustomColumn: (semesterKey: string) => void;
    clearColumn: (semesterKey: string) => void;
    clearAndHideColumn: (semesterKey: string) => void;
}

export const usePlannerStore = create<PlannerState>((set) => ({
    board: generateEmptyBoard(),
    dragState: { draggingModuleCode: null, isOverInvalidSem: false },
    visibleCustomColumns: [],

    setBoard: (board) =>
        set(() => {
            const loadedCustomCols = Object.keys(board).filter(
                (key) => isCustomSemesterKey(key) && board[key].length > 0
            );

            return { board, visibleCustomColumns: loadedCustomCols };
        }),

    setDragState: (dragState) => set({ dragState }),

    setSemesterData: (semesterKey, modules) =>
        set((state) => ({
            board: { ...state.board, [semesterKey]: modules },
        })),

    addModule: (semesterKey, module) =>
        set((state) => {
            const isDuplicate = Object.values(state.board).some((sem) =>
                sem.some((m) => m.moduleCode === module.moduleCode)
            );

            if (isDuplicate) return state;

            return {
                board: {
                    ...state.board,
                    [semesterKey]: [...(state.board[semesterKey] || []), module],
                },
            };
        }),

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

            // Extract and move the module to the right position within destColumn
            const [movedModule] = sourceColumn.splice(fromIndex, 1);
            destColumn.splice(toIndex, 0, movedModule);

            // Update if the moved module is now an exemption
            movedModule.isExemption = isExemptionKey(toSem);
            if (!isExemptionKey(toSem)) movedModule.excludeFromTotal = false;

            // Update the displayOrder for every module in these columns
            sourceColumn.forEach((mod, index) => (mod.displayOrder = index));
            destColumn.forEach((mod, index) => (mod.displayOrder = index));

            // Update the board with the updated columns
            newBoard[fromSem] = sourceColumn;
            newBoard[toSem] = destColumn;
            return { board: newBoard };
        }),

    toggleExcludeFromTotal: (semesterKey: string, moduleCode: string) =>
        set((state) => ({
            board: {
                ...state.board,
                [semesterKey]: state.board[semesterKey].map((mod) =>
                    mod.moduleCode === moduleCode
                        ? { ...mod, excludeFromTotal: !mod.excludeFromTotal }
                        : mod
                ),
            },
        })),

    showCustomColumn: (semesterKey) =>
        set((state) => ({
            visibleCustomColumns: [...new Set([...state.visibleCustomColumns, semesterKey])],
        })),

    clearColumn: (semesterKey) =>
        set((state) => ({
            board: { ...state.board, [semesterKey]: [] },
        })),

    clearAndHideColumn: (semesterKey) =>
        set((state) => ({
            board: { ...state.board, [semesterKey]: [] },
            visibleCustomColumns: state.visibleCustomColumns.filter((k) => k !== semesterKey),
        })),
}));
