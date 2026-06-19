import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import PreReqTree from "@/components/PreRequisiteComponent/PreReqTree";
import { Legend } from "@/components/PreRequisiteComponent/Legend";
import { useModulePrerequisites } from "@/hooks/PreReqHooks/useModulePrerequisites";

export default function Pre_Requisite() {
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    const { formatted_tree, isLoading, isError, moduleDetails, hasNoPrereqs } =
        useModulePrerequisites(selectedModule);

    return (
        <div className="space-y-6">
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
            <div className="w-full mt-6">
                <SearchBar onSelect={(code) => setSelectedModule(code)} />
            </div>

            <div className="w-full mt-8">
                {/* if Loading/Error/NoPreReq */}
                {isLoading && <p>Fetching pre-requisite details...</p>}
                {isError && <p> An unknown error has occurred.</p>}
                {hasNoPrereqs && <p>This module has no prerequisites.</p>}

                {/* Otherwise, render formatted tree component with fallback guard */}
                {/* render with remaining space accounting sidebar to prevent overflow using calc()*/}
                {!isLoading && selectedModule && moduleDetails?.prereqTree && (
                    <div className="w-full max-w-[calc(100vw-var(--sidebar-width,16rem)-4rem)] overflow-x-auto custom-scrollbar py-4">
                        <div className="flex flex-col items-center min-w-max w-full">
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

// EDGE CASES:
// NM4260, NM4102, DAO2702, ACC3706, ADS5201, XFA4401

// LABELS TO CONSIDER FOR EXPANSION LOGIC
// any of, all of, at least N of