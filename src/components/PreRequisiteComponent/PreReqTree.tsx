import { useState } from "react";
import type { FormattedPreReqNode } from "@/utils/prereqUtils/treeFormatter";

interface PreReqTreeProps {
  node: FormattedPreReqNode;
  isRoot?: boolean;
  isMandatory?: boolean;
}

export default function PreReqTree({ node, isRoot = true, isMandatory = true }: PreReqTreeProps) {
    
    // state to handle bulky prefix expansion
    const [isExpanded, setIsExpanded] = useState(false);

    // dynamic unpacking of prefix node into actual modules satisfying
    let activeNode = node;
    if (node.type === "prefix-branch" && isExpanded && node.allPossibleMatches) {
        activeNode = {
        ...node,
        or: node.allPossibleMatches.map((code) => ({ type: "leaf", moduleCode: code })),
        };
    }

    // RENDER LOGIC FOR DIFFERENT NODE TYPES ~leaf~ ~prefix branch~ ~branch~
    switch (activeNode.type) {

        case "leaf": {
            const cleanedCode = activeNode.moduleCode?.split(":")[0] || "";
            let boxColor = "bg-white dark:bg-zinc-800 text-foreground border-zinc-400 dark:border-zinc-600";
            if (isRoot) {
                boxColor = "bg-[#E8A753] text-black border-[#cf9043]";
            } else if (isMandatory) {
                boxColor = "bg-[#719E8E] text-white border-[#5d8275]";
            }

            return (
                <div className="flex flex-col items-center min-w-[100px] shrink-0">
                <div className={`px-4 py-2 text-sm font-semibold font-mono rounded-xl border shadow-sm text-center ${boxColor}`}>
                    {cleanedCode}
                </div>
                </div>
            );
        }

        case "prefix-branch": {
            const children = (activeNode.or || []) as FormattedPreReqNode[];
            const hasChildren = children.length > 0;

            return (
                <div className="flex flex-col items-center w-full">
                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="px-4 py-2 text-xs font-mono font-bold rounded-xl border shadow-md transition-all duration-150 hover:scale-105 active:scale-95 text-center cursor-pointer select-none min-w-[140px] bg-[#719E8E] text-white border-[#5d8275]"
                >
                    <div className="flex items-center gap-1.5 justify-center">
                    <span>{activeNode.prefixLabel}</span>
                    <span className="text-[10px] opacity-75 font-mono">
                        ({node.allPossibleMatches?.length}) {hasChildren ? "▲" : "▼"}
                    </span>
                    </div>
                </button>

                {hasChildren && (
                    <div className="flex flex-col items-center w-full mt-2">
                    <div className="w-0.5 h-6 bg-border" />
                    <div className="bg-background px-2 text-xs text-muted-foreground -my-1 z-10">matches</div>
                    <div className="w-0.5 h-4 bg-border" />
                    <div className="w-full max-w-4xl p-4 bg-muted/50 border border-dashed border-border rounded-2xl mx-auto overflow-x-auto">
                        <div className="flex flex-row justify-start md:justify-center items-start min-w-max px-2">
                        {children.map((childNode, index) => (
                            <div key={childNode.moduleCode || index} className="flex flex-col items-center relative px-4">
                            {children.length > 1 && (
                                <div className={`absolute top-0 h-0.5 bg-border -z-10 ${index === 0 ? "left-1/2 right-0" : ""} ${index === children.length - 1 ? "left-0 right-1/2" : ""} ${index > 0 && index < children.length - 1 ? "left-0 right-0" : ""}`} />
                            )}
                            <div className="w-0.5 h-4 bg-border" />
                            <PreReqTree node={childNode} isRoot={false} isMandatory={isMandatory} />
                            </div>
                        ))}
                        </div>
                    </div>
                    </div>
                )}
                </div>
            );
        }

        case "branch": {
            const children = (activeNode.and || activeNode.or || []) as FormattedPreReqNode[];
            const currentLabel = activeNode.label || (activeNode.and ? "needs all of" : "needs any of");

            return (
                <div className="flex flex-col items-center w-full">
                {children.length > 0 && (
                    <div className="flex flex-col items-center">
                    <div className="w-0.5 h-6 bg-zinc-400 dark:bg-zinc-600" />
                    <span className="bg-background text-muted-foreground text-[10px] px-2 select-none -my-1 z-10 whitespace-nowrap">
                        {currentLabel.toLowerCase()}
                    </span>
                    <div className="w-0.5 h-4 bg-zinc-400 dark:bg-zinc-600" />
                    </div>
                )}
                <div className="flex flex-row justify-center items-start w-full isolate">
                    {children.map((childNode, index) => (
                    <div key={index} className="flex flex-col items-center relative w-full">
                        {children.length > 1 && (
                        <div className={`absolute top-0 h-0.5 bg-zinc-400 dark:bg-zinc-600 -z-10 ${index === 0 ? "left-1/2 right-0" : ""} ${index === children.length - 1 ? "left-0 right-1/2" : ""} ${index > 0 && index < children.length - 1 ? "left-0 right-0" : ""}`} />
                        )}
                        <div className="w-0.5 h-4 bg-zinc-400 dark:bg-zinc-600" />
                        <PreReqTree node={childNode} isRoot={false} isMandatory={!!activeNode.and || isMandatory} />
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

