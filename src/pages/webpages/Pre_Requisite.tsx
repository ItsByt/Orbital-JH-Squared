import { useState } from "react";
import SearchBar from "@/components/GeneralComponents/SearchBar";
import PreReqTree from "@/components/PreRequisiteComponent/PreReqTree";
import { Legend } from "@/components/PreRequisiteComponent/Legend";
import { useModulePrerequisites } from "@/hooks/PreReqHooks/useModulePrerequisites";

export default function Pre_Requisite() {
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    const { formatted_tree, isLoading, isError, moduleDetails, hasNoPrereqs } =
        useModulePrerequisites(selectedModule);

    return (
        <div className="space-y-6 w-full">
            <div>
                {/* Header */}
                <h1
                    className="text-4xl font-bold"
                    style={{ fontFamily: "Bahnschrift, sans-serif", color: "#56A58B" }}
                >
                    Pre-Requisite Tree
                </h1>
                {/* Color Legend */}
                <Legend />
            </div>

            {/* SearchBar */}
            <div className="w-full mt-6 relative z-50">
                <SearchBar onSelect={(code) => setSelectedModule(code)} />
            </div>

            {/* 'grid grid-cols-1 min-w-0' forms a strict layout perimeter around the tree content. */}
            {/* Preventing global page overflow (double scrollbars) and clipping when the sidebar closes. */}

            <div className="w-full mt-8 grid grid-cols-1 min-w-0">
                {/* if Loading/Error/NoPreReq */}
                {isLoading && <p>Fetching pre-requisite details...</p>}
                {isError && <p> An unknown error has occurred.</p>}
                {hasNoPrereqs && <p>This module has no prerequisites.</p>}

                {/* Otherwise, render formatted tree component with fallback guard */}
                {!isLoading && selectedModule && moduleDetails?.prereqTree && (
                    <div className="w-full overflow-x-auto custom-scrollbar py-4">
                        <div className="flex flex-col items-center min-w-max mx-auto px-4">
                            <div className="px-5 py-2.5 bg-[#E8A753] text-black border border-[#cf9043] text-base font-bold font-mono rounded-xl shadow-md min-w-[120px] text-center z-10">
                                {selectedModule.toUpperCase()}
                            </div>
                            {formatted_tree ? (
                                <PreReqTree node={formatted_tree} isRoot={false} />
                            ) : (
                                <p className="text-xs text-muted-foreground mt-4 animate-pulse">
                                    Processing tree dependencies...
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
