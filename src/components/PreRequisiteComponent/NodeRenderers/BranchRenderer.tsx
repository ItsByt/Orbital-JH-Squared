import { useState } from "react";
import type { FormattedPreReqNode } from "@/types";
import { getConnector, connectorStyle } from "@/utils/prereqUtils/lines&Box";
import PreReqTree from "../PreReqTree";

interface BranchRendererProps {
    node: FormattedPreReqNode;
    onToggleExpand?: (isExpanded: boolean) => void;
    disableExpansion?: boolean;
}


//-------------------------------
//  REGULAR BRANCH NODE RENDERER 
//-------------------------------
export default function BranchRenderer({ node, onToggleExpand, disableExpansion = false }: BranchRendererProps) {

    // The node received should be formatted already 
    // make use of its properties to retrieve the list of children
    const children = (node.and || node.or || []) as FormattedPreReqNode[];
    
    // The two  booleans that are dependent on the formatted node's label are
    // needed to decide whether the hiding principle will be applied on children's leaf click
    // Also needed to simply render the correct label.
    const isAtLeastBranch = !!node.label?.toLowerCase().includes("at least");
    const isOrBranch = !isAtLeastBranch && (
        !!node.or || 
        node.label?.toLowerCase().includes("any") || 
        node.label?.toLowerCase().includes("one") 
    );
                        
    // Extract the label for rendering later
    const label = node.label || (isOrBranch ? "needs any of" : "needs all of");

    // // State to track position of child that has been clicked
    const [activeChildIdx, setActiveChildIdx] = useState<number | null>(null);


    // On click of any children, onToggleExpand calls this function to handle logic.
    // If the branch happens to be OR type, remember the child position
    // and its boolean state whether expanded or not
    const handleChildToggle = (idx: number, isChildExpanded: boolean) => {
        if (disableExpansion) return;
        if (isOrBranch) {
            setActiveChildIdx(isChildExpanded ? idx : null);
        }
        onToggleExpand?.(isChildExpanded);
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

// FYI:
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