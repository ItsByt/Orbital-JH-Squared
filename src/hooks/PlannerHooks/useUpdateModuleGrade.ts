import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { usePlannerStore } from "@/store/usePlannerStore";
import { updatePlannerModuleGradeDB } from "@/services/plannerDB";
import { getErrorMessage } from "@/utils/generalUtils/getErrorMessage";

interface UpdateGradeVariables {
    semesterKey: string;
    moduleCode: string;
    grade: string | undefined;
    previousGrade: string | undefined;
}

export function useUpdateModuleGrade() {
    const setModuleGrade = usePlannerStore((state) => state.setModuleGrade);

    const moduleGradeMuutation = useMutation<void, Error, UpdateGradeVariables>({
        mutationFn: async ({ moduleCode, grade }) => {
            // Convert undefined to null for Supabase
            await updatePlannerModuleGradeDB(moduleCode, grade ?? null);
        },
        onMutate: ({ semesterKey, moduleCode, grade }) => {
            // Optimistic update of UI
            setModuleGrade(semesterKey, moduleCode, grade);
        },
        onError: (error, variables) => {
            setModuleGrade(variables.semesterKey, variables.moduleCode, variables.previousGrade);
            toast.error("Failed to save grade", { description: getErrorMessage(error) });
        },
    });

    return moduleGradeMuutation;
}
