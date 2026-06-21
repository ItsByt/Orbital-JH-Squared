import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getModule, getModuleCodes } from "@/services/nusmods";
import { formatTree } from "@/utils/prereqUtils/treeFormatter";

//------------------------------------------
// G U I D E:
// retrieves formatted tree with memoization,
// loading implementation, error handling
// boolean on whether pre-reqs exist,
// as well as details of the module
//------------------------------------------

export const useModulePrerequisites = (selectedModule: string | null) => {
    // Fetch array of all NUS codes once for prefix searching
    const { data: moduleCodes = [] } = useQuery({
        queryKey: ["allModuleCodes"],
        queryFn: () => getModuleCodes(),
        staleTime: 1000 * 60 * 60 * 24,
    });

    // For SearchBar's module, fetch pre-req raw tree data
    const {
        data: moduleDetails,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["module", selectedModule],
        queryFn: () => getModule(selectedModule!),
        enabled: !!selectedModule,
        staleTime: 1000 * 60 * 5,
    });

    // Raw tree data from API formatted for use,
    // memoized to avoid unnecessary repeated formatting inside HTML
    const formatted_tree = useMemo(() => {
        if (!moduleDetails?.prereqTree || moduleCodes.length === 0) return null;
        return formatTree(moduleDetails.prereqTree, moduleCodes);
    }, [moduleDetails?.prereqTree, moduleCodes]);

    return {
        formatted_tree,
        isLoading,
        isError,
        moduleDetails,
        hasNoPrereqs: !!(selectedModule && moduleDetails && !moduleDetails.prereqTree),
    };
};
