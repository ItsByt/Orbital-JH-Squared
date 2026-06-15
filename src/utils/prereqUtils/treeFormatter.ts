import type { PreReqNode } from "@/types";

//--------------------------------------------------------------------------------
// Formatted pre-req node structure:
//      Cleans up unecessary details from raw tree
//      and accounts for optional data such as
//      (label) (possible matches to prefix)
//      Similar to raw tree, may store recursive data
export interface FormattedPreReqNode {
    type: "leaf" | "prefix-branch" | "branch"; // possible representations
    moduleCode?: string;       // e.g., "NM4102" if leaf OR
    prefixLabel?: string;      // e.g. "NM1% Modules"if prefix-branch
    and?: FormattedPreReqNode[]; // "and" recursive branch
    or?: FormattedPreReqNode[];  // "or" recursive branch
    allPossibleMatches?: string[]; // all possible matches satisfying if prefix
    label?: string; // e.g. "at least 7 of" rule
}
//--------------------------------------------------------------------------------

// G U I D E:
// Transforms raw and potentially rule-heavy NUSMods prerequisite tree data structure
// into a cleaned formatted version via recursive rebuild.
// Accepts arguments of the raw tree and list of NUS module codes

//--------------------------------------------------------------------------------

export function formatTree(
    node: PreReqNode, 
    allValidCodes: string[]
): FormattedPreReqNode {
    // Edge case 
    if (!node) return { type: "leaf", moduleCode: "" };

    // -----------------------------------------------------------------------
    // BASE CASE: THE NODE IS A STRING - EXACT TEXT MODULE / RAW TEXT RULE
    // -----------------------------------------------------------------------
    if (typeof node === "string") {

        // format and clean data with removal of e.g. [:D]
        const formattedText = node.split(":")[0].replace(/\\"/g, '"').trim();
        // Extract prefix criterias if any to do matching
        const extractedPrefixes = formattedText.match(/[A-Z]{2,4}\d{4}%?/);
        // Identify if the string has rules by locating % 
        const hasWildcardPrefix = extractedPrefixes?.some(p => p.includes("%"));
        
        // IF STRING IS RULE BASED WITH PREFIXES, transform and return node
        if (hasWildcardPrefix && extractedPrefixes) {
            let requiredCount: string | null = null;
            
            // Get rule constraint details (number to satisfy)
            const coursesMatch = formattedText.match(/COURSES\s*\((\d+)\)/i);
            if (coursesMatch) {
                requiredCount = coursesMatch[1];
            } else {
                const atLeastMatch = formattedText.match(/at least\s*(\d+)/i);
                if (atLeastMatch) requiredCount = atLeastMatch[1];
            }

            // prepare to transform rule heavy string into a prefix branch type node
            const prefixBranches: FormattedPreReqNode[] = [];

            // Locate actual modules matching prefix criteria and sort
            extractedPrefixes.forEach(prefix => {
                const searchPrefix = prefix.replace(/%$/, "");
                const discovered = allValidCodes.filter(actualCode => 
                    actualCode.startsWith(searchPrefix)
                ).sort();

                prefixBranches.push({
                    type: "prefix-branch",
                    prefixLabel: `Courses beginning with ${searchPrefix}`,
                    or: [], 
                    allPossibleMatches: discovered
                });
            });

            // Return transformed node
            return {
                type: "branch",
                or: prefixBranches,
                label: requiredCount 
                    ? `needs at least ${requiredCount} modules from`
                    : `needs any of`
            };
        }

        // IF STRING IS JUST STANDARD MODULE CODE, return as is
        return {
            type: "branch",
            label: " ", 
            and: [
                {
                    type: "leaf",
                    moduleCode: formattedText
                }
            ]
        };
    }

    // -----------------------------------------------------------------------
    // RECURSIVE CASE: THE NODE IS A STRUCTURAL TREE, TRAVEL RECURSIVELY
    // -----------------------------------------------------------------------
    if (typeof node === "object" && node !== null) {
        
        // Because of potentially optional fields in the unknown raw tree,
        // cast node as a Record if not it cannot bypass Typescript compilation checks
        // compilation checks
        const structuralTemplate = node as Record<string, unknown>;
        
        // 3 FIELDS TO INTERPRET RECURSIVELY IN A NON-STRING NODE:
        // CASE 1: "nOf" present
        // CASE 2: "AND" present
        // CASE 3: "OR" present
        // Either of the cases must exist and be intercepted

        // CASE 1:
        if ("nOf" in structuralTemplate && Array.isArray(structuralTemplate.nOf)) {
            const requiredCount = structuralTemplate.nOf[0]; 
            const rawElements = structuralTemplate.nOf[1];   

            const prefixBranches: FormattedPreReqNode[] = [];

            if (Array.isArray(rawElements)) {
                rawElements.forEach((el: unknown) => {
                    if (typeof el === "string") {
                        const cleanPrefix = el.split(":")[0].replace(/%/g, "").trim();
                        // Yes this is the same process as the base case raw text rule
                        // because strangely the API provides it as either text heavy rule
                        // or structure based for prefix branch type
                        // see edge cases DAO2702X and NM4102 differences
                        const discovered = allValidCodes.filter(actualCode => 
                            actualCode.startsWith(cleanPrefix)
                        ).sort();
                        prefixBranches.push({
                            type: "prefix-branch",
                            prefixLabel: `Courses beginning with ${cleanPrefix}`,
                            or: [], 
                            allPossibleMatches: discovered
                        });
                    }
                });
            }

            return {
                type: "branch",
                or: prefixBranches,
                label: `needs at least ${requiredCount} modules from`
            };
        }


        const mutatedNode: FormattedPreReqNode = { type: "branch" };

        // CASE 2:
        if ("and" in structuralTemplate && Array.isArray(structuralTemplate.and)) {
            mutatedNode.and = structuralTemplate.and.map(child => 
                formatTree(child, allValidCodes)
            );
        }

        // CASE 3:
        if ("or" in structuralTemplate && Array.isArray(structuralTemplate.or)) {
            mutatedNode.or = structuralTemplate.or.map(child => 
                formatTree(child, allValidCodes)
            );
        }

        // Retain labels if present for the cleaned node
        if ("label" in structuralTemplate && typeof structuralTemplate.label === "string") {
            mutatedNode.label = structuralTemplate.label;
        }

        return mutatedNode;
    }

    return { type: "leaf", moduleCode: "" };
}






// EDGE CASES:
// NM4260, NM4102, DAO2702, ACC3706, ADS5201

// COMMANDS TO CONSIDER
// any of, all of, at least N of, needs only