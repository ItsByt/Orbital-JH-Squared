import { useState } from "react";
import { renderLeaf, renderBranch, renderPrefixBranch } from "./NodeRenderers";
import type { FormattedPreReqNode } from "@/types";

export interface PreReqTreeProps {
  node: FormattedPreReqNode;
  isRoot?: boolean;
  isMandatory?: boolean;
}

//--------------------------------------------------------------------------------
// G U I D E:
// Renders the Tree itself, abstracted components see NodeRenderers, lines&Box
//--------------------------------------------------------------------------------

export default function PreReqTree({ node, isRoot = true, isMandatory = true }: PreReqTreeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const connectorStyle = "bg-zinc-400 dark:bg-zinc-600";

  // dynamically intercept nodes that are prefix branch and transform it into the needed possible matching nodes
  let activeNode = node;
  if (node.type === "prefix-branch" && isExpanded && node.allPossibleMatches) {
    activeNode = { ...node, or: node.allPossibleMatches.map((code) => ({ type: "leaf", moduleCode: code })) };
  }

  switch (activeNode.type) {
    case "leaf": return renderLeaf(activeNode, isRoot, isMandatory);
    case "prefix-branch": return renderPrefixBranch(activeNode, () => setIsExpanded(!isExpanded), isMandatory, connectorStyle);
    case "branch": return renderBranch(activeNode, isMandatory, connectorStyle);
    default: return null;
  }
}