import { useQuery } from "@tanstack/react-query";
import { getModule } from "@/services/nusmods";

export function useModulePrereq(moduleCode: string, isCustom?: boolean) {
    const { data: prereqTree } = useQuery({
        queryKey: ["prereq", moduleCode],
        queryFn: async () => {
            const data = await getModule(moduleCode);
            return data?.prereqTree || null;
        },
        enabled: !isCustom, // returns undefined for custom modules
        staleTime: Infinity,
        gcTime: Infinity,
    });

    return prereqTree;
}
