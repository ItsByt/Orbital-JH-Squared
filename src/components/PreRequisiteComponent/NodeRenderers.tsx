import type { FormattedPreReqNode } from "@/types";
import { getBoxColor, getConnector } from "@/utils/prereqUtils/lines&Box";
import PreReqTree from "./PreReqTree"; // needed for recursion

// Function to render leaf node
export const renderLeaf = (
    node: FormattedPreReqNode,
    isRoot: boolean,
    isMandatory: boolean
    ) => (
    <div className="flex flex-col items-center min-w-[100px] shrink-0">
        <div className={`px-4 py-2 text-sm font-semibold font-mono rounded-xl border shadow-sm text-center ${getBoxColor(isRoot, isMandatory)}`}>
        {node.moduleCode?.split(":")[0] || ""}
        </div>
    </div>
);

// Function to render prefix branch node
export const renderPrefixBranch = (
    node: FormattedPreReqNode,
    toggle: () => void,
    isMandatory: boolean,
    connectorStyle: string
    ) => {
    const children = (node.or || []) as FormattedPreReqNode[];
    return (
        <div className="flex flex-col items-center w-full">
        <button
            type="button"
            onClick={toggle}
            className="
                px-4 py-2 text-xs font-mono font-bold rounded-xl border shadow-md 
                bg-[#719E8E] text-white border-[#5d8275] min-w-[140px]
                transition-all duration-150 
                hover:scale-105 active:scale-95 
                cursor-pointer select-none
            "
        >
            <div className="flex items-center gap-1.5 justify-center">
                <span>{node.prefixLabel}</span>
                <span className="text-[10px] opacity-75">
                    ({node.allPossibleMatches?.length}) {children.length > 0 ? "▲" : "▼"}
                </span>
            </div>
        </button>
        {children.length > 0 && (
            <div className="flex flex-col items-center w-full mt-2">
            <div className={`w-0.5 h-6 ${connectorStyle}`} />
            <div className="bg-background px-2 text-xs text-muted-foreground -my-1 z-10">matches</div>
            <div className={`w-0.5 h-4 ${connectorStyle}`} />
            <div className="w-full max-w-4xl p-4 bg-muted/50 border border-dashed rounded-2xl overflow-x-auto">
                <div className="flex flex-row justify-start md:justify-center items-start min-w-max px-2">
                {children.map((child, idx) => (
                    <div key={child.moduleCode || idx} className="flex flex-col items-center relative px-4">
                    {children.length > 1 && <div className={`absolute top-0 h-0.5 ${connectorStyle} -z-10 ${getConnector(idx, children.length)}`} />}
                    <div className={`w-0.5 h-4 ${connectorStyle}`} />
                    <PreReqTree node={child} isRoot={false} isMandatory={isMandatory} />
                    </div>
                ))}
                </div>
            </div>
            </div>
        )}
        </div>
    );
};

// Function to render regular branch node
export const renderBranch = (
    node: FormattedPreReqNode,
    isMandatory: boolean,
    connectorStyle: string
    ) => {
    const children = (node.and || node.or || []) as FormattedPreReqNode[];
    const label = node.label || (node.and ? "needs all of" : "needs any of");
    return (
        <div className="flex flex-col items-center w-full">
        {children.length > 0 && (
            <div className="flex flex-col items-center">
            <div className={`w-0.5 h-6 ${connectorStyle}`} />
            <span className="bg-background text-muted-foreground text-[10px] px-2 -my-1 z-10">{label.toLowerCase()}</span>
            <div className={`w-0.5 h-4 ${connectorStyle}`} />
            </div>
        )}
        <div className="flex flex-row justify-center items-start w-full isolate">
            {children.map((child, idx) => (
            <div key={idx} className="flex flex-col items-center relative w-full">
                {children.length > 1 && <div className={`absolute top-0 h-0.5 ${connectorStyle} -z-10 ${getConnector(idx, children.length)}`} />}
                <div className={`w-0.5 h-4 ${connectorStyle}`} />
                <PreReqTree node={child} isRoot={false} isMandatory={!!node.and || isMandatory} />
            </div>
            ))}
        </div>
        </div>
    );
};