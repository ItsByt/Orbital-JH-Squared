import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Loader2 } from "lucide-react";
import type { PlannerModule } from "@/types";
import AutoCompleteSearch from "@/hooks/GeneralHooks/useModuleSearch";
import { usePlannerStore } from "@/store/usePlannerStore";
import { getModule } from "@/services/nusmods";
import { getNextDisplayOrder, buildPlannerModule } from "@/utils/plannerUtils/plannerFormatters";
import { addToPlannerModuleDB } from "@/services/plannerDB";
import { checkValidSemesterUsingModuleDetails } from "@/utils/plannerUtils/validateModuleSemester";
import { isUnvalidatedSemesterKey, parseSemesterKey } from "@/utils/plannerUtils/semesterKeyUtils";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/generalUtils/getErrorMessage";

interface DBAddVariables {
    newModule: PlannerModule;
    year: number;
    semester: number;
    semesterKey: string;
}

export default function AddCourseModal({
    open,
    onOpenChange,
    semesterKey,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    semesterKey: string;
}) {
    const queryClient = useQueryClient();

    const { searchTerm, setSearchTerm, searchResults, isLoading } = AutoCompleteSearch();
    const addModule = usePlannerStore((state) => state.addModule);
    const removeModule = usePlannerStore((state) => state.removeModule);

    const [isFetchingDetails, setIsFetchingDetails] = useState(false);

    const dbAddMutation = useMutation<void, Error, DBAddVariables>({
        mutationFn: async ({ newModule, year, semester }) => {
            await addToPlannerModuleDB(newModule, year, semester);
        },
        onMutate: ({ newModule, semesterKey }) => {
            // Optimistic update of UI
            addModule(semesterKey, newModule);
            onOpenChange(false);
            setSearchTerm("");
            toast.success(`${newModule.moduleCode} has been successfully added!`);
        },
        onError: (error, variables) => {
            // Rollback on error
            removeModule(variables.semesterKey, variables.newModule.moduleCode);
            toast.error("Failed to add module", { description: getErrorMessage(error) });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["plannerBoard"] });
        },
    });

    const handleSelectModule = async (moduleCode: string) => {
        const board = usePlannerStore.getState().board;
        const currentSemModules = board[semesterKey] || [];

        const isDuplicate = Object.values(board).some((semesterArray) =>
            semesterArray.some((mod) => mod.moduleCode === moduleCode)
        );

        if (isDuplicate) {
            toast.error(`${moduleCode} is already in your planner!`);
            return;
        }

        try {
            setIsFetchingDetails(true);

            const moduleDetails = await getModule(moduleCode);
            if (!moduleDetails) {
                toast.error("Module details could not be found.");
                return;
            }

            const { year, semester } = parseSemesterKey(semesterKey);

            if (!isUnvalidatedSemesterKey(semesterKey)) {
                const isValidSemester = checkValidSemesterUsingModuleDetails(
                    moduleDetails,
                    semester
                );
                if (!isValidSemester) {
                    toast.error(`${moduleCode} is not available in Semester ${semester}!`);
                    return;
                }
            }

            const nextOrder = getNextDisplayOrder(currentSemModules);
            const newModule = buildPlannerModule(moduleDetails, nextOrder, semesterKey);

            dbAddMutation.mutate({ newModule, year, semester, semesterKey });
        } catch (error) {
            toast.error("An error occurred.", { description: getErrorMessage(error) });
        } finally {
            setIsFetchingDetails(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) setSearchTerm("");

        onOpenChange(newOpen);
    };

    const isProcessing = isFetchingDetails || dbAddMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[450px] bg-[#18181b] border-zinc-800 p-0 overflow-hidden gap-0">
                <DialogTitle className="sr-only">Add Module to {semesterKey}</DialogTitle>
                <DialogHeader className="p-4 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                        <Search className="h-4 w-4 text-zinc-500" />
                        <input
                            className="bg-transparent border-none outline-none text-zinc-200 text-sm w-full"
                            placeholder="Search module code or title..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                        {isLoading && <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />}
                    </div>
                </DialogHeader>

                <div className="max-h-[300px] overflow-y-auto p-2">
                    {searchResults.length === 0 && searchTerm && !isLoading && (
                        <p className="text-center py-4 text-xs text-zinc-500">No modules found.</p>
                    )}
                    {searchResults.map((mod) => (
                        <button
                            key={mod.moduleCode}
                            onClick={() => handleSelectModule(mod.moduleCode)}
                            disabled={isProcessing}
                            className="w-full text-left p-3 hover:bg-zinc-800/50 rounded-md transition-colors flex flex-col group cursor-pointer"
                        >
                            <span className="text-xs font-bold text-[#56A58B]">
                                {mod.moduleCode}
                            </span>
                            <span className="text-[11px] text-zinc-400 group-hover:text-zinc-200">
                                {mod.title}
                            </span>
                        </button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
