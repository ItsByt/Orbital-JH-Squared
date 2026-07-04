import type { PrereqTree, FormattedPreReqNode } from "@/types";
import { createPrefixBranch, parseStringRule } from "./prefix&Parse";

//--------------------------------------------------------------------------------
// G U I D E:
// Transforms raw and potentially rule-heavy NUSMods prerequisite tree data structure
// into a cleaned formatted version via recursive rebuild with provided labels.
// Accepts arguments of the raw tree and the fetched list of NUS codes
//--------------------------------------------------------------------------------

export function formatTree(node: PrereqTree, allValidCodes: string[]): FormattedPreReqNode {
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
        const structure = node as Record<string, unknown>;

        // 3 FIELDS TO INTERPRET RECURSIVELY IN A NON-STRING NODE:
        // CASE 1: "nOf" present (prefix or exact)
        // CASE 2: "AND" present
        // CASE 3: "OR" present
        // Either of the cases must exist and be intercepted

        // EDGE CASE: "cohort" requirement
        if ("cohort" in structure) {
            const cohortData = structure.cohort as { rule?: string; years?: string[] };

            const formattedYears =
                cohortData.years
                    ?.map((y) => {
                        if (y.startsWith("S:")) return y.replace("S:", "starting from ");
                        if (y.startsWith("E:")) return y.replace("E:", "up till ");
                        return y;
                    })
                    .join(", ") || "";

            return {
                type: "branch",
                label: `Cohorts ${formattedYears}`.trim(),
            };
        }

        // CASE 1:
        if ("nOf" in structure && Array.isArray(structure.nOf)) {
            // Cast elements as PrereqTree[] instead of string[] to handle
            // both wildcard strings and exact exact module strings/objects
            const [count, elements] = structure.nOf as [number, PrereqTree[]];

            return {
                type: "branch",
                label: `needs at least ${count} of`,
                or: elements.map((elem) => {
                    // Prefix % TYPE
                    if (typeof elem === "string" && elem.includes("%")) {
                        return createPrefixBranch(elem, allValidCodes);
                    }
                    // EXACT MODULE TYPE
                    return formatTree(elem, allValidCodes);
                }),
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
