import { useState } from "react";
import type { FormattedPreReqNode } from "@/types";
import { getConnector, getBoxColor, connectorStyle } from "@/utils/prereqUtils/lines&Box";
import { useModulePrerequisites } from "@/hooks/PreReqHooks/useModulePrerequisites";

//--------------------------------------------------------------------------------
// G U I D E:
// Accepts the node of a formatted tree, and renders everything recursively
// depending on the type of node encountered (leaf/prefixbranch/branch)
//--------------------------------------------------------------------------------
// TBD: IM GOING TO ABSTRACT AND REFACTOR ALL THIS
// But for now I've done my best to annotate what this mess is



// Props to expect (will need to mandatorily provide node)
// 1. Node of Interest (changes every recursive call)
// 2. is it a Root boolean
// 3. callback function that carries isExpanded boolean to deal with hiding logic
// 4. disableExpansion property to cater to the prefix matching modules
export interface PreReqTreeProps {
    node: FormattedPreReqNode;
    isRoot?: boolean;
    onToggleExpand?: (isExpanded: boolean) => void;
    disableExpansion?: boolean; 
}


// Main function: destructure object, set values as required
export default function PreReqTree({ 
    node, 
    isRoot = true, 
    onToggleExpand,
    disableExpansion = false
}: PreReqTreeProps) {


    // if node input is the root, check type and render accordingly
    // A. branch type, then use branch renderer 
    // B. just a solo leaf as root, use leaf renderer
    if (isRoot) {
        return (
        <div className="flex flex-col items-center w-full">
            {node.type === "branch" && (
            <BranchRenderer 
                node={node} 
                onToggleExpand={onToggleExpand} 
                disableExpansion={disableExpansion} 
            />
            )}
            {node.type === "leaf" && (
            <LeafRenderer 
                node={node} 
                onToggleExpand={onToggleExpand} 
                disableExpansion={disableExpansion} 
            />
            )}
        </div>
        );
    }

    // if the node is NOT a root, then consider the three cases
    // and render accordingly by type using the correct renderer function.
    switch (node.type) {
        case "leaf": 
        return (
            <LeafRenderer 
            node={node} 
            onToggleExpand={onToggleExpand} 
            disableExpansion={disableExpansion}
            />
        );
        case "prefix-branch": 
        return (
            <PrefixBranchRenderer 
            node={node} 
            onToggleExpand={onToggleExpand} 
            />
        );
        case "branch": 
        return (
            <BranchRenderer 
            node={node} 
            onToggleExpand={onToggleExpand}
            disableExpansion={disableExpansion}
            />
        );
        default: 
        return null;
    }
}


// ALL RENDERING FUNCTIONS ARE BELOW ( I WILL ABSTRACT THIS )


//-----------------------
//  LEAF NODE RENDERER 
//-----------------------
function LeafRenderer({ 
    node, 
    onToggleExpand,
    disableExpansion = false
    }: { 
    node: FormattedPreReqNode; 
    onToggleExpand?: (isExpanded: boolean) => void;
    disableExpansion?: boolean;
    }) {

    // State to track click expansion. Naturally default to false yet to expand
    const [isExpanded, setIsExpanded] = useState(false);

    // Only retrieve node's formatted subtree structure if it is expanded and has a valid module code
    // Also get the isLoading and hasNoPrereqs for conditional rendering if retrieved tree
    const { formatted_tree: subTree, isLoading, hasNoPrereqs } = useModulePrerequisites(
        isExpanded && node.moduleCode ? node.moduleCode : null
    );

    // function to handle toggle. Ignores click if disableExpansion is true.
    // IsExpanded criteria will dictate what will render
    // On click, it will flip the boolean for IsExpanded and pass it on via
    // callback onToggleExpand function to the parent to do hiding logic (KIV see branch UI)
    const handleToggle = () => {
        if (disableExpansion) return; 
        
        const nextState = !isExpanded;
        setIsExpanded(nextState);
        if (onToggleExpand) {
            onToggleExpand(nextState)
        };
    };

    const boxColor = getBoxColor(isExpanded);

    // Hover effects dependent on clickable or not (disableExpansion)
    // Stops leaves derived from prefic branch from expanding
    const interactionClasses = disableExpansion
        ? "cursor-default select-none"
        : "hover:scale-105 active:scale-95 cursor-pointer select-none";

    // UI COMPONENT - Button handles toggle and isExpanded flip, 
    // Expanded? Then consider conditional render cases, otherwise recurse on the subtree
    // and render the vertical line below to connect with it
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
                <p className="text-[10px] text-muted-foreground animate-pulse">Loading prerequisites...</p>
            )}
            
            {hasNoPrereqs && (
                <p className="text-[10px] text-muted-foreground italic">No prerequisites</p>
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

//--------------------------------
//       BRANCH RENDERER 
//--------------------------------
function BranchRenderer({ 
    node, 
    onToggleExpand,
    disableExpansion = false
    }: { 
    node: FormattedPreReqNode; 
    onToggleExpand?: (isExpanded: boolean) => void;
    disableExpansion?: boolean;
    }) {
    
    // The node received should be formatted already thanks to leaf's recursive pass in,
    // make use of its properties to retrieve the list of children
    const children = (node.and || node.or || []) as FormattedPreReqNode[];
    
    // The two constants are booleans that are dependent on the formatted node's label
    // needed to decide whether the hiding principle will be applied on children's leaf click
    // Also needed to simply render the correct label
    const isAtLeastBranch = !!node.label?.toLowerCase().includes("at least");
    const isOrBranch = !isAtLeastBranch && (
        !!node.or || 
        node.label?.toLowerCase().includes("any") || 
        node.label?.toLowerCase().includes("one") 
    );
                        
    // Extract the label for rendering later
    const label = node.label || (isOrBranch ? "needs any of" : "needs all of");

    // State to track position of child that has been clicked
    const [activeChildIdx, setActiveChildIdx] = useState<number | null>(null);

    // On click of any children, this function will handle logic
    // if the branch happens to be OR type, remember the child position
    // and its boolean state whether expanded or not
    const handleChildToggle = (idx: number, isChildExpanded: boolean) => {
        if (disableExpansion) return;
        if (isOrBranch) {
        setActiveChildIdx(isChildExpanded ? idx : null);
        }
        if (onToggleExpand) onToggleExpand(isChildExpanded);
    };


    // Gather children (node details and position) to render 
    // if not OR: then retain all children to render even after click
    // if OR and the position of child is known, only render that child
    const childrenWithIndex = children.map((child, idx) => ({ child, originalIdx: idx }));
    const renderedChildren = isOrBranch && activeChildIdx !== null
        ? childrenWithIndex.filter(item => item.originalIdx === activeChildIdx)
        : childrenWithIndex;


    // UI COMPONENT 
    // 1. label and vertical connector 
    // 2. into a mapping of all the rendered children rendered via recursive call, 
    // 3. each tied to their respective horizontal connector from lines&Box 

    // The true importance of the callback function onToggleExpand lies in:
    // "onToggleExpand={(isExpanded) => handleChildToggle(item.originalIdx, isExpanded)}"
    // where it is passed to the children, whose info on true will report back to the parent branch
    // to carry out handleChildToggle for correct hiding/rendering. This will propogate up further
    // via "if (onToggleExpand) onToggleExpand(isChildExpanded)" to tell grandparent branches 
    // to activate their own handlechildToggle as required (should there be a cascading effect)

    // Example:
    //      any of
    //   CS0      CS1
    // on clicking CS1 to expand, it will tell the branch that idx = 1 is opened, isChildExpanded = true.
    // This would call the parent's handleChildToggle which will have have the active child's idx logged.
    // The rendered children will see that it belongs in an OR branch
    // and completely ignore CS0, by which it will be hidden to the user by not being rendered. 

    return (
        <div className="flex flex-col items-center w-full">
        {renderedChildren.length > 0 && (
            <div className="flex flex-col items-center">
            <div className={`w-0.5 h-6 ${connectorStyle}`} />
            {activeChildIdx === null && (
                <span className="bg-background text-muted-foreground text-[10px] px-2 -my-1 z-10">
                {label.toLowerCase()}
                </span>
            )}
            <div className={`w-0.5 h-4 ${connectorStyle}`} />
            </div>
        )}
        
        <div className="flex flex-row justify-center items-start w-full isolate">
            {renderedChildren.map((item, displayIdx) => (
            <div key={item.originalIdx} className="flex flex-col items-center relative w-full">
                {renderedChildren.length > 1 && (
                <div className={`absolute top-0 h-0.5 ${connectorStyle} -z-10 ${getConnector(displayIdx, renderedChildren.length)}`} />
                )}
                <div className={`w-0.5 h-4 ${connectorStyle}`} />
                <PreReqTree 
                node={item.child} 
                isRoot={false} 
                onToggleExpand={(isExpanded) => handleChildToggle(item.originalIdx, isExpanded)}
                disableExpansion={disableExpansion}
                />
            </div>
            ))}
        </div>
        </div>
    );
}

//----------------------------------------
// PREFIX BRANCH RENDERER 
//----------------------------------------
function PrefixBranchRenderer({ 
    node, 
    onToggleExpand
    }: { 
    node: FormattedPreReqNode; 
    onToggleExpand?: (isExpanded: boolean) => void;
    }) {

    // same logic as branch honestly but simpler since no any/or checks
    const [isExpanded, setIsExpanded] = useState(false);

    const handleToggle = () => {
        const nextState = !isExpanded;
        setIsExpanded(nextState);
        if (onToggleExpand) onToggleExpand(nextState);
    };

    const handleChildToggle = (isChildExpanded: boolean) => {
        if (onToggleExpand) onToggleExpand(isChildExpanded);
    };

    // on click of the prefix option, gather array of all the possible matches
    // and structure them as leaves for display
    let activeNode = node;
    if (isExpanded && node.allPossibleMatches) {
        activeNode = { 
        ...node, 
        or: node.allPossibleMatches.map((code) => ({ type: "leaf", moduleCode: code })) 
        };
    }

    // No need to hide anything, simply render all matching modules
    const children = (activeNode.or || []) as FormattedPreReqNode[];
    const renderedChildren = children.map((child, idx) => ({ child, originalIdx: idx }));
    const boxColorClass = getBoxColor(isExpanded);


    // UI COMPONENT - again similar to branch, but theres a button for the prefix option to expand
    // into the children via handleToggle's flip of isExpanded
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
            <div className="bg-background px-2 text-xs text-muted-foreground -my-1 z-10">matches</div>
            <div className={`w-0.5 h-4 ${connectorStyle}`} />
            <div className="w-full max-w-4xl p-4 bg-muted/50 border border-dashed rounded-2xl overflow-x-auto">
                <div className="flex flex-row justify-start md:justify-center items-start min-w-max px-2">
                {renderedChildren.map((item, displayIdx) => (
                    <div key={item.originalIdx} className="flex flex-col items-center relative px-4">
                    {renderedChildren.length > 1 && (
                        <div className={`absolute top-0 h-0.5 ${connectorStyle} -z-10 ${getConnector(displayIdx, renderedChildren.length)}`} />
                    )}
                    <div className={`w-0.5 h-4 ${connectorStyle}`} />
                    <PreReqTree 
                        node={item.child} 
                        isRoot={false} 
                        onToggleExpand={handleChildToggle}
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