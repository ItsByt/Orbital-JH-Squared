import type { PreReqNode, FormattedPreReqNode } from "@/types";
import { createPrefixBranch, parseStringRule } from "./prefix&Parse";

//--------------------------------------------------------------------------------
// G U I D E:
// Transforms raw and potentially rule-heavy NUSMods prerequisite tree data structure
// into a cleaned formatted version via recursive rebuild with provided labels.
// Accepts arguments of the raw tree and the fetched list of NUS codes
//--------------------------------------------------------------------------------

export function formatTree(node: PreReqNode, allValidCodes: string[]): FormattedPreReqNode {
    // Edge case
    if (!node) return { type: "leaf", moduleCode: "" };

    // -----------------------------------------------------------------------
    // BASE CASE: THE NODE IS A STRING
    // -----------------------------------------------------------------------
    if (typeof node === "string") {
        return parseStringRule(node, allValidCodes);
    }

    // -----------------------------------------------------------------------
    // RECURSIVE CASE: THE NODE HAS A TREE STRUCTURE
    // -----------------------------------------------------------------------
    if (typeof node === "object" && node !== null) {
        // Because of potentially optional fields in the unknown raw tree,
        // cast node as a Record if not it cannot bypass Typescript compilation checks
        // compilation checks
        const structure = node as Record<string, unknown>;

        // 3 FIELDS TO INTERPRET RECURSIVELY IN A NON-STRING NODE:
        // CASE 1: "nOf" present
        // CASE 2: "AND" present
        // CASE 3: "OR" present
        // Either of the cases must exist and be intercepted

        // CASE 1:
        if ("nOf" in structure && Array.isArray(structure.nOf)) {
            const [count, elements] = structure.nOf as [number, string[]];
            return {
                type: "branch",
                label: `needs at least ${count} modules from`,
                or: elements.map((el) => createPrefixBranch(el, allValidCodes)),
            };
        }

        const mutatedNode: FormattedPreReqNode = { type: "branch" };

        // CASE 2:
        if ("and" in structure && Array.isArray(structure.and)) {
            mutatedNode.and = structure.and.map((child) => formatTree(child, allValidCodes));
        }

        // CASE 3:
        if ("or" in structure && Array.isArray(structure.or)) {
            mutatedNode.or = structure.or.map((child) => formatTree(child, allValidCodes));
        }

        // Retain labels if present for the cleaned node for UI use later
        if ("label" in structure && typeof structure.label === "string") {
            mutatedNode.label = structure.label;
        }

        return mutatedNode;
    }

    return { type: "leaf", moduleCode: "" };
}
