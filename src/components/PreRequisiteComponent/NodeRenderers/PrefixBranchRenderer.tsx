import { useState } from "react";
import type { FormattedPreReqNode } from "@/types";
import { getConnector, getBoxColor, connectorStyle } from "@/utils/prereqUtils/lines&Box";
import PreReqTree from "../PreReqTree";

interface PrefixBranchRendererProps {
    node: FormattedPreReqNode;
    onToggleExpand?: (isExpanded: boolean) => void;
}

//-------------------------
// PREFIX BRANCH RENDERER
//-------------------------
export default function PrefixBranchRenderer({ node, onToggleExpand }: PrefixBranchRendererProps) {
    // same logic as branch but simpler since no any/or checks to decide hiding
    const [isExpanded, setIsExpanded] = useState(false);

    const handleToggle = () => {
        const nextState = !isExpanded;
        setIsExpanded(nextState);
        onToggleExpand?.(nextState);
    };

    // on click of the prefix option, gather array of all the possible matches
    // and structure them as leaves for display
    let activeNode = node;
    if (isExpanded && node.allPossibleMatches) {
        activeNode = {
            ...node,
            or: node.allPossibleMatches.map((code) => ({ type: "leaf", moduleCode: code })),
        };
    }

    // No need to hide anything, simply render all matching modules
    const children = (activeNode.or || []) as FormattedPreReqNode[];
    const renderedChildren = children.map((child, idx) => ({ child, originalIdx: idx }));
    const boxColorClass = getBoxColor(isExpanded);

    // UI COMPONENT - again similar to branch, but theres a button for the prefix option to expand
    // into the children via handleToggle's flip of isExpanded.
    // no need for handleChildToggle since child expansion disabled.
    return (
        <div className="flex flex-col items-center w-full">
            <button
                type="button"
                onClick={handleToggle}
                className={`px-4 py-2 text-xs font-mono font-bold rounded-xl border shadow-md min-w-[140px] transition-all duration-150 select-none ${boxColorClass} hover:scale-105 active:scale-95 cursor-pointer`}
            >
                <div className="flex items-center gap-1.5 justify-center">
                    <span>{node.prefixLabel}</span>
                    <span className="text-[10px] opacity-75">
                        ({node.allPossibleMatches?.length}) {isExpanded ? "▲" : "▼"}
                    </span>
                </div>
            </button>

            {isExpanded && renderedChildren.length > 0 && (
                <div className="flex flex-col items-center w-full mt-2">
                    <div className={`w-0.5 h-6 ${connectorStyle}`} />
                    <div className="bg-background px-2 text-xs text-muted-foreground -my-1 z-10">
                        matches
                    </div>
                    <div className={`w-0.5 h-4 ${connectorStyle}`} />
                    <div className="w-full max-w-4xl p-4 bg-muted/50 border border-dashed rounded-2xl overflow-x-auto">
                        <div className="flex flex-row justify-start md:justify-center items-start min-w-max px-2">
                            {renderedChildren.map((item, displayIdx) => (
                                <div
                                    key={item.originalIdx}
                                    className="flex flex-col items-center relative px-4"
                                >
                                    {renderedChildren.length > 1 && (
                                        <div
                                            className={`absolute top-0 h-0.5 ${connectorStyle} -z-10 ${getConnector(displayIdx, renderedChildren.length)}`}
                                        />
                                    )}
                                    <div className={`w-0.5 h-4 ${connectorStyle}`} />
                                    <PreReqTree
                                        node={item.child}
                                        isRoot={false}
                                        onToggleExpand={onToggleExpand}
                                        disableExpansion={true}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
