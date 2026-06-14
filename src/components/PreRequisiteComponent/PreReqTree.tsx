import { useState } from "react";
import type { FormattedPreReqNode } from "@/utils/prereqUtils/treeFormatter";

interface PreReqTreeProps {
    node: FormattedPreReqNode;
    isRoot?: boolean; 
    isMandatory?: boolean; 
}

export default function PreReqTree({ node, isRoot = true, isMandatory = true }: PreReqTreeProps) {
    // State to handle expansion of prefix modules
    const [isExpanded, setIsExpanded] = useState(false);

    // Inject prefix nodes with hidden matches
    let activeNode = node;
    if (node.type === "prefix-branch" && isExpanded && node.allPossibleMatches) {
        activeNode = {
            ...node,
            or: node.allPossibleMatches.map(code => ({ type: "leaf", moduleCode: code }))
        };
    }
    // simple helper to replace % with K for prefix modules
    const formatLabel = (label: string | undefined) => label?.replace(/%/g, 'K') || "";



    // Render according to type of node
    switch (activeNode.type) {
        
        // BASE CASE: REGULAR LEAF NODE 
        case "leaf": {
            const cleanedCode = activeNode.moduleCode?.split(":")[0] || "";
            let boxColor = "bg-white dark:bg-zinc-800 text-foreground border-zinc-400 dark:border-zinc-600"; // default
            
            if (isRoot) {
                boxColor = "bg-[#E8A753] text-black border-[#cf9043]"; // orange - User Selected Module
            } else if (isMandatory) {
                boxColor = "bg-[#719E8E] text-white border-[#5d8275]"; // green - Mandatory, must select
            }

            return (
                <div className="flex flex-col items-center min-w-[100px] shrink-0">
                    <div className={`px-4 py-2 text-sm font-semibold font-mono rounded-xl border shadow-sm text-center ${boxColor}`}>
                        {cleanedCode}
                    </div>
                </div>
            );
        }

        // RECURSIVE CASE A: PREFIX NODE (EXPANDABLE) 
        case "prefix-branch": {
            const children = (activeNode.or || []) as FormattedPreReqNode[];
            const hasChildren = children.length > 0;
            const displayLabel = formatLabel(activeNode.prefixLabel);

            return (
                <div className="flex flex-col items-center w-full">
                    {/* Button to expand prefix matches */}
                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="px-4 py-2 text-xs font-mono font-bold rounded-xl border shadow-md transition-all duration-150 hover:scale-105 active:scale-95 text-center cursor-pointer select-none min-w-[140px] bg-[#719E8E] text-white border-[#5d8275]"
                    >
                        <div className="flex items-center gap-1.5 justify-center">
                            <span>{displayLabel}</span>
                            <span className="text-[10px] opacity-75 font-mono">
                                ({node.allPossibleMatches?.length}) {hasChildren ? "▲" : "▼"}
                            </span>
                        </div>
                    </button>

                    {hasChildren && (
                        <div className="flex flex-col items-center w-full">
                            {/* Vertical connector line pointing down */}
                            <div className="w-0.5 h-14 bg-border flex flex-col items-center justify-center">
                                <span className="bg-background text-muted-foreground text-xs px-2 select-none">
                                    any of
                                </span>
                            </div>

                            {/* All Children mapped */}
                            <div className="w-full max-w-4xl p-4 bg-muted/50 border border-dashed border-border rounded-2xl mx-auto overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-700">
                                <div className="flex flex-row justify-start md:justify-center items-start min-w-max px-2 isolate pt-3">
                                    {children.map((childNode, index) => (
                                        <div key={childNode.moduleCode || index} className="flex flex-col items-center relative px-4 pt-3">
                                            {/* Horizontal brancher */}
                                            <div 
                                                className={`absolute top-0 h-0.5 bg-border -z-10
                                                    ${index === 0 ? "left-1/2 right-0" : ""} 
                                                    ${index === children.length - 1 ? "left-0 right-1/2" : ""}
                                                    ${index > 0 && index < children.length - 1 ? "left-0 right-0" : ""}
                                                `}
                                            />
                                            <div className="w-0.5 h-3 bg-border absolute top-0" />
                                            
                                            {/* Recursive call on Component */}
                                            <PreReqTree 
                                                node={childNode} 
                                                isRoot={false} 
                                                isMandatory={isMandatory} 
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

        // RECURSIVE CASE B: STANDARD TREE (AND / OR) 
        case "branch": {
            const children = (activeNode.and || activeNode.or || []) as FormattedPreReqNode[];
            const connector = activeNode.and ? "needs all of" : "needs any of";
            const currentLabel = activeNode.label || connector;

            return (
                <div className="flex flex-col items-center w-full">
                    {/* Vertical connector line pointing down */}
                    <div className="w-0.5 h-16 bg-border flex flex-col items-center justify-center">
                        <span className="bg-background text-muted-foreground text-xs px-2 select-none whitespace-nowrap">
                            {currentLabel.toLowerCase()}
                        </span>
                    </div>

                    {/* All Children mapped with Horizonatal Brancher */}
                    <div className="flex flex-row justify-center items-start w-full isolate pt-3">
                        {children.map((childNode, index) => (
                            <div key={index} className="flex flex-col items-center relative px-4 pt-3 w-full">
                                {children.length > 1 && (
                                    <>
                                        <div 
                                            className={`absolute top-0 h-0.5 bg-border -z-10
                                                ${index === 0 ? "left-1/2 right-0" : ""} 
                                                ${index === children.length - 1 ? "left-0 right-1/2" : ""}
                                                ${index > 0 && index < children.length - 1 ? "left-0 right-0" : ""}
                                            `}
                                        />
                                        <div className="w-0.5 h-3 bg-border absolute top-0" />
                                    </>
                                )}
                                {/* Recursive call on Component */}
                                <PreReqTree 
                                    node={childNode} 
                                    isRoot={false} 
                                    isMandatory={!!activeNode.and || isMandatory} 
                                />
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        default:
            return null;
    }
}
