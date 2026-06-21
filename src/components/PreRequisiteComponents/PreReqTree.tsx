import type { FormattedPreReqNode } from "@/types";
import LeafRenderer from "./NodeRenderers/LeafRenderer";
import BranchRenderer from "./NodeRenderers/BranchRenderer";
import PrefixBranchRenderer from "./NodeRenderers/PrefixBranchRenderer";

//--------------------------------------------------------------------------------
// G U I D E:
// Accepts the node of a formatted tree, and renders everything recursively
// depending on the type of node encountered (leaf/prefixbranch/branch)
// Acts like a switchboard to do any traversal. PRT -> Node -> PRT -> Node etc.
//--------------------------------------------------------------------------------

// Props to expect (will need to mandatorily provide node)
// 1. Node of Interest (changes every recursive call)
// 2. Whether it a Root boolean
// 3. Callback function that carries isExpanded boolean to deal with hiding logic
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
    disableExpansion = false,
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
            return <PrefixBranchRenderer node={node} onToggleExpand={onToggleExpand} />;
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

// REFER TO RESPECTIVE NODE RENDERER COMPONENT FILES FOR DETAILS
