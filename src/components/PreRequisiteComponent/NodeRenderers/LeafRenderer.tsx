import { useState } from "react";
import type { FormattedPreReqNode } from "@/types";
import { getBoxColor, connectorStyle } from "@/utils/prereqUtils/lines&Box";
import { useModulePrerequisites } from "@/hooks/PreReqHooks/useModulePrerequisites";
import PreReqTree from "../PreReqTree";

interface LeafRendererProps {
    node: FormattedPreReqNode;
    onToggleExpand?: (isExpanded: boolean) => void;
    disableExpansion?: boolean;
}

//-----------------------
//  LEAF NODE RENDERER
//-----------------------
export default function LeafRenderer({
    node,
    onToggleExpand,
    disableExpansion = false,
}: LeafRendererProps) {
    // State to track click expansion. Naturally default to false yet to expand
    const [isExpanded, setIsExpanded] = useState(false);

    // Only retrieve node's formatted subtree structure if it is expanded and has a valid module code
    // Also get the isLoading and hasNoPrereqs for conditional rendering on retrieving tree
    const {
        formatted_tree: subTree,
        isLoading,
        hasNoPrereqs,
    } = useModulePrerequisites(isExpanded && node.moduleCode ? node.moduleCode : null);

    // function to handle toggle. Ignores click if disableExpansion is true.
    // IsExpanded criteria will dictate what will render.
    // On click, it will flip the boolean for IsExpanded and pass it on via
    // callback onToggleExpand function to the parent to do hiding logic (KIV see branch UI)
    const handleToggle = () => {
        if (disableExpansion) return;
        const nextState = !isExpanded;
        setIsExpanded(nextState);
        onToggleExpand?.(nextState);
    };

    const boxColor = getBoxColor(isExpanded);
    // Hover effects dependent on clickable or not (disableExpansion)
    // Stops leaves derived from prefix branch from expanding
    const interactionClasses = disableExpansion
        ? "cursor-default select-none"
        : "hover:scale-105 active:scale-95 cursor-pointer select-none";

    // UI COMPONENT - Button handles toggle and isExpanded flip,
    // Expanded? Then consider conditional render cases, otherwise recurse on the subtree
    // and render the vertical line below to connect with it
    // Conditional render cases: Still Loading, No pre-reqs, Dead Module
    // Take note: NoPreReqs true means API confirmed 0 modules. False can mean either no data, or have pre reqs
    // To separate modules with subtree and dead modules, need to look at existence of subtree data itself.
    return (
        <div className="flex flex-col items-center w-full min-w-[100px] shrink-0">
            <button
                type="button"
                onClick={handleToggle}
                className={`px-4 py-2 text-sm font-semibold font-mono rounded-xl border shadow-sm text-center transition-all duration-150 ${boxColor} ${interactionClasses}`}
            >
                {node.moduleCode?.split(":")[0] || ""}
            </button>

            {isExpanded && !disableExpansion && (
                <div className="flex flex-col items-center w-full mt-2">
                    <div className={`w-0.5 h-6 ${connectorStyle}`} />

                    {isLoading && (
                        <p className="text-[10px] text-muted-foreground animate-pulse">
                            Loading prerequisites...
                        </p>
                    )}

                    {!isLoading && hasNoPrereqs && (
                        <p className="text-[10px] text-muted-foreground italic px-2 text-center mt-1">
                            No prerequisites
                        </p>
                    )}

                    {!isLoading && !hasNoPrereqs && !subTree && (
                        <div className="flex flex-col items-center text-center mt-1">
                            <p className="text-[9px] text-red-400/80 italic px-2 mt-0.5">
                                This module no longer exists
                            </p>
                        </div>
                    )}

                    {subTree && !isLoading && (
                        <div className="w-full flex flex-col items-center">
                            <PreReqTree node={subTree} isRoot={false} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
