import { useQuery } from "@tanstack/react-query";
import { getModule } from "@/services/nusmods";

export function useModulePrereq(moduleCode: string) {
    const { data: prereqTree } = useQuery({
        queryKey: ["prereq", moduleCode],
        queryFn: async () => {
            const data = await getModule(moduleCode);
            return data?.prereqTree || null;
        },
        staleTime: Infinity,
        gcTime: Infinity,    
    });

    return prereqTree;
}