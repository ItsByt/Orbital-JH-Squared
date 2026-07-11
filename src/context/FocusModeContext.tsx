import { createContext, useContext, useState, useMemo, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePlannerStore } from "@/store/usePlannerStore";
import { generateFocusMap, type FocusResult } from "@/utils/plannerUtils/focusModeUtils";

interface FocusModeContextType {
    isFocusMode: boolean;
    focusedModule: string | null;
    focusMap: Record<string, FocusResult>;
    toggleFocusMode: () => void;
    setFocusedModule: (code: string | null) => void;
}

const FocusModeContext = createContext<FocusModeContextType | undefined>(undefined);

export function FocusModeProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();
    const board = usePlannerStore((state) => state.board);

    const [isFocusMode, setIsFocusMode] = useState(false);
    const [focusedModule, setFocusedModule] = useState<string | null>(null);

    const toggleFocusMode = () => {
        setIsFocusMode((prev) => {
            // If previously on and now turned off, we unfocus our module
            if (prev) setFocusedModule(null);
            return !prev;
        });
    };

    const focusMap = useMemo(() => {
        if (!isFocusMode) return {};
        return generateFocusMap(focusedModule, board, queryClient);
    }, [isFocusMode, focusedModule, board, queryClient]);

    return (
        <FocusModeContext.Provider
            value={{ isFocusMode, focusedModule, focusMap, toggleFocusMode, setFocusedModule }}
        >
            {children}
        </FocusModeContext.Provider>
    );
}

export function useFocusModeContext() {
    const context = useContext(FocusModeContext);
    if (!context) throw new Error("useFocusModeContext must be used within FocusModeProvider");
    return context;
}
