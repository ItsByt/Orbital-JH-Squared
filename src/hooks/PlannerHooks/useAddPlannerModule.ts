import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { PlannerModule } from "@/types";
import { usePlannerStore } from "@/store/usePlannerStore";
import { addToPlannerModuleDB } from "@/services/plannerDB";
import { getErrorMessage } from "@/utils/generalUtils/getErrorMessage";

interface DBAddVariables {
    newModule: PlannerModule;
    year: number;
    semester: number;
    semesterKey: string;
}

export function useAddPlannerModule(onSuccessCallback?: () => void) {
    const queryClient = useQueryClient();
    const addModule = usePlannerStore((state) => state.addModule);
    const removeModule = usePlannerStore((state) => state.removeModule);

    const dbAddMutation = useMutation<void, Error, DBAddVariables>({
        mutationFn: async ({ newModule, year, semester }) => {
            await addToPlannerModuleDB(newModule, year, semester);
        },
        onMutate: ({ newModule, semesterKey }) => {
            // Optimistic update of UI
            addModule(semesterKey, newModule);
            if (onSuccessCallback) onSuccessCallback();
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

    return dbAddMutation;
}
