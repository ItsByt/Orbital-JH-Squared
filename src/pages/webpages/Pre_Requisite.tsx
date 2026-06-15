import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import SearchBar from "@/components/SearchBar";
import PreReqTree from "@/components/PreRequisiteComponent/PreReqTree";
import { getModule, getModuleCodes } from "@/services/nusmods";
import { formatTree } from "@/utils/prereqUtils/treeFormatter";


export default function Pre_Requisite() {

    const [selectedModule, setSelectedModule] = useState<string | null>(null);

    // Fetch array of all NUS codes once for prefix searching
    const { data: moduleCodes = [] } = useQuery({
        queryKey: ["allModuleCodes"],
        queryFn: () => getModuleCodes(),
        staleTime: 1000 * 60 * 60 * 24, 
    });

    // For SearchBar's module, fetch pre-req raw tree data
    const { data: moduleDetails, isLoading, isError } = useQuery({
        queryKey: ["module", selectedModule],
        queryFn: () => getModule(selectedModule!), 
        enabled: !!selectedModule, 
        staleTime: 1000 * 60 * 5,
    });

    // Raw tree data from API formatted for use, 
    // memoized to avoid unnecessary repeated formatting inside HTML
    const cleanExtendedTree = useMemo(() => {
        if (!moduleDetails?.prereqTree || moduleCodes.length === 0) return null;
        return formatTree(moduleDetails.prereqTree, moduleCodes);
    }, [moduleDetails?.prereqTree, moduleCodes]);


return (
        <div className="space-y-6">
            <div>
                {/*  Header */}
                <h1 className="text-4xl font-bold" style={{ fontFamily: "Bahnschrift, sans-serif", color: "#56A58B" }}>
                    Pre-Requisite Tree
                </h1>
                {/*  Color Legend Reference */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium font-sans text-muted-foreground">
                    <span className="text-foreground font-bold tracking-wider text-sm normal-case mr-1">
                        Legend:
                    </span>
                    
                    <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 bg-[#E8A753] border border-[#cf9043] rounded-sm shadow-xs" />
                        <span>Chosen Path</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 bg-[#719E8E] border border-[#5d8275] rounded-sm shadow-xs" />
                        <span>Unbranched Options</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 bg-card border border-border rounded-sm shadow-xs" />
                        <span> Hidden Modules</span>
                    </div>
                </div>
            </div>

            {/*  SearchBar */}
            <div className="w-full mt-6">
                <SearchBar onSelect={(code) => setSelectedModule(code)} />
            </div>

            <div className="w-full mt-8">

                {/* if Loading */}
                {isLoading && (
                    <p className="text-muted-foreground animate-pulse">
                        Fetching prerequisite details...
                    </p>
                )}

                {/* if Error */}
                {isError && (
                    <p className="text-destructive">
                        An unknown error has occurred.
                    </p>
                )}

                {/* if Pre Req Tree data does not exist in moduleDetails */}
                {!isLoading && selectedModule && moduleDetails && !moduleDetails.prereqTree && (
                    <p className="text-muted-foreground">
                        This module has no prerequisites.
                    </p>
                )}

                {/* Otherwise, render formatted tree component with fallback guard */}
                {!isLoading && selectedModule && moduleDetails?.prereqTree && (
                    <div className="w-full overflow-x-auto py-4">
                        <div className="flex flex-col items-center min-w-max w-full">
                            <div className="px-5 py-2.5 bg-[#E8A753] text-black border border-[#cf9043] text-base font-bold font-mono rounded-xl shadow-md min-w-[120px] text-center z-10">
                                {selectedModule.toUpperCase()}
                            </div>
                            {cleanExtendedTree ? (
                                <PreReqTree node={cleanExtendedTree}  isRoot={false} />
                            ) : (
                                <p className="text-xs text-muted-foreground mt-4 animate-pulse">Processing tree dependencies...</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}