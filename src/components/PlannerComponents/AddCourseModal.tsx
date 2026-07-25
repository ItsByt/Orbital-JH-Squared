import { useState } from "react";
import { Search, Loader2, ArrowLeft } from "lucide-react";
import AutoCompleteSearch from "@/hooks/GeneralHooks/useModuleSearch";
import { usePlannerStore } from "@/store/usePlannerStore";
import { getModule } from "@/services/nusmods";
import {
    getNextDisplayOrder,
    buildPlannerModule,
    buildCustomPlannerModule,
} from "@/utils/plannerUtils/plannerFormatters";
import { checkValidSemesterUsingModuleDetails } from "@/utils/plannerUtils/validateModuleSemester";
import { isUnvalidatedSemesterKey, parseSemesterKey } from "@/utils/plannerUtils/semesterKeyUtils";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/generalUtils/getErrorMessage";
import { useAddPlannerModule } from "@/hooks/PlannerHooks/useAddPlannerModule";
import CustomModuleForm from "./CustomModuleForm";

export default function AddCourseModal({
    open,
    onOpenChange,
    semesterKey,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    semesterKey: string;
}) {
    const targetSemester = isUnvalidatedSemesterKey(semesterKey)
        ? undefined
        : parseSemesterKey(semesterKey).semester;

    const { searchTerm, setSearchTerm, searchResults, isLoading } =
        AutoCompleteSearch(targetSemester);

    const [isFetchingDetails, setIsFetchingDetails] = useState(false);
    const [isCustomMode, setIsCustomMode] = useState(false);

    const dbAddMutation = useAddPlannerModule(() => {
        onOpenChange(false);
        resetStates();
    });

    const resetStates = () => {
        setSearchTerm("");
        setIsCustomMode(false);
    };

    const checkDuplicate = (moduleCode: string) => {
        const board = usePlannerStore.getState().board;
        const isDuplicate = Object.values(board).some((semesterArray) =>
            semesterArray.some((mod) => mod.moduleCode === moduleCode)
        );

        return isDuplicate;
    };

    const handleSelectAPIModule = async (moduleCode: string) => {
        if (checkDuplicate(moduleCode)) {
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

            const board = usePlannerStore.getState().board;
            const currentSemModules = board[semesterKey] || [];

            const nextOrder = getNextDisplayOrder(currentSemModules);
            const newModule = buildPlannerModule(moduleDetails, nextOrder, semesterKey);

            dbAddMutation.mutate({ newModule, year, semester, semesterKey });
        } catch (error) {
            toast.error("An error occurred.", { description: getErrorMessage(error) });
        } finally {
            setIsFetchingDetails(false);
        }
    };

    const handleAddCustomModule = (code: string, title: string, credits: number) => {
        const formattedCode = code.toUpperCase().trim();
        if (checkDuplicate(formattedCode)) {
            toast.error(`${formattedCode} is already in your planner!`);
            return;
        }

        const { year, semester } = parseSemesterKey(semesterKey);
        const board = usePlannerStore.getState().board;
        const currentSemModules = board[semesterKey] || [];

        const newModule = buildCustomPlannerModule(
            formattedCode,
            title,
            credits,
            getNextDisplayOrder(currentSemModules),
            semesterKey
        );

        dbAddMutation.mutate({ newModule, year, semester, semesterKey });
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) resetStates();
        onOpenChange(newOpen);
    };

    const isProcessing = isFetchingDetails || dbAddMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[450px] bg-[#18181b] border-zinc-800 p-0 overflow-hidden gap-0">
                <DialogTitle className="sr-only">Add Module to {semesterKey}</DialogTitle>

                {/* To Toggle between Search Input and Back Button (If in Custom Mode) */}
                <DialogHeader className="p-4 border-b border-zinc-800">
                    {!isCustomMode ? (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <Search className="h-4 w-4 text-zinc-500" />
                                <input
                                    className="bg-transparent border-none outline-none text-zinc-200 text-sm w-full"
                                    placeholder="Search module code or title..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                                {isLoading && (
                                    <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />
                                )}
                            </div>
                            <button
                                onClick={() => setIsCustomMode(true)}
                                className="text-xs text-[#56A58B] hover:text-[#468973] text-left font-medium transition-colors"
                            >
                                + Create Custom Module
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsCustomMode(false)}
                                className="text-zinc-400 hover:text-zinc-200 transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                            <span className="text-sm font-medium text-zinc-200">
                                Create Custom Module
                            </span>
                        </div>
                    )}
                </DialogHeader>

                {/* To Toggle between API Search Results and Custom Module Form */}
                <div className="max-h-[300px] overflow-y-auto">
                    {!isCustomMode ? (
                        <div className="p-2">
                            {searchResults.length === 0 && searchTerm && !isLoading && (
                                <p className="text-center py-4 text-xs text-zinc-500">
                                    No modules found.
                                </p>
                            )}
                            {searchResults.map((mod) => (
                                <button
                                    key={mod.moduleCode}
                                    onClick={() => handleSelectAPIModule(mod.moduleCode)}
                                    disabled={isProcessing}
                                    className="w-full text-left p-3 hover:bg-zinc-800/50 rounded-md transition-colors flex flex-col group cursor-pointer disabled:opacity-50"
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
                    ) : (
                        <CustomModuleForm
                            semesterKey={semesterKey}
                            isProcessing={isProcessing}
                            onSubmit={handleAddCustomModule}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
