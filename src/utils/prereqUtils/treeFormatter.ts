import type { PreReqNode } from "@/types";

// Formatted pre-req tree interface
export interface FormattedPreReqNode {
    type: "leaf" | "prefix-branch" | "branch";
    moduleCode?: string;       // e.g., "NM4102" OR
    prefixLabel?: string;      // e.g. "NM1% Modules"
    and?: FormattedPreReqNode[]; // and recursive branch
    or?: FormattedPreReqNode[];  // or recursive branch
    allPossibleMatches?: string[]; // all possible matches if prefix on click
    label?: string; // e.g. "at least 7 of"
}


// Transforms an raw and rule-heavy NUSMods prerequisite tree data structure
// into a cleaned formatted version.

export function formatTree(
    node: PreReqNode, 
    allValidCodes: string[]
): FormattedPreReqNode {
    // Edge case safety fallbacks
    if (!node) return { type: "leaf", moduleCode: "" };

    // -----------------------------------------------------------------------
    // BASE CASE: THE NODE IS A TEXT MODULE STRING OR RAW TEXT RULE
    // -----------------------------------------------------------------------
    if (typeof node === "string") {
        // format regardless
        const formattedText = node.split(":")[0].replace(/\\"/g, '"').trim();
        
        // Identify if the string has rules and prefixes
        const hasRuleKeywords = /starting with|level|modules?|prefix|any|COURSES|%|at least/i.test(formattedText);
        const extractedPrefixes = formattedText.match(/[A-Z]{2,3}[1-4]?\b/g);

        // IF STRING IS IS RULE BASED WITH PREFIXES
        if (hasRuleKeywords && extractedPrefixes) {
            let requiredCount: string | null = null;
            
            // Get rule constraint details
            const coursesMatch = formattedText.match(/COURSES\s*\((\d+)\)/i);
            if (coursesMatch) {
                requiredCount = coursesMatch[1];
            } else {
                const atLeastMatch = formattedText.match(/at least\s*(\d+)/i);
                if (atLeastMatch) requiredCount = atLeastMatch[1];
            }

            const prefixBranches: FormattedPreReqNode[] = [];

            // Locate actual modules matching prefix criteria
            extractedPrefixes.forEach(prefix => {
                const discovered = allValidCodes.filter(actualCode => 
                    actualCode.startsWith(prefix)
                ).sort();

                prefixBranches.push({
                    type: "prefix-branch",
                    prefixLabel: `${prefix}% Modules`,
                    or: [], 
                    allPossibleMatches: discovered
                });
            });

            return {
                type: "branch",
                or: prefixBranches,
                label: requiredCount 
                    ? `needs at least ${requiredCount} modules from:`
                    : `Fulfills choice paths matching:`
            };
        }

        // IF STRING IS JUST STANDARD MODULE CODE 
        return {
            type: "leaf",
            moduleCode: formattedText
        };
    }

    // -----------------------------------------------------------------------
    // RECURSIVE CASE: THE NODE IS A STRUCTURAL TREE, TRAVEL RECURSIVELY
    // -----------------------------------------------------------------------
    if (typeof node === "object" && node !== null) {
        const structuralTemplate = node as Record<string, unknown>;
        
        // Target and parse NUSMods API "nOf" conditional pairs
        if ("nOf" in structuralTemplate && Array.isArray(structuralTemplate.nOf)) {
            const requiredCount = structuralTemplate.nOf[0]; 
            const rawElements = structuralTemplate.nOf[1];   

            const prefixBranches: FormattedPreReqNode[] = [];

            if (Array.isArray(rawElements)) {
                rawElements.forEach((el: unknown) => {
                    if (typeof el === "string") {
                        const cleanPrefix = el.split(":")[0].replace(/%/g, "").trim();
                        
                        // Locate actual modules matching prefix criteria (same as base case)
                        const discovered = allValidCodes.filter(actualCode => 
                            actualCode.startsWith(cleanPrefix)
                        ).sort();

                        // Build prefix branches
                        prefixBranches.push({
                            type: "prefix-branch",
                            prefixLabel: `${cleanPrefix}% Modules`,
                            or: [], 
                            allPossibleMatches: discovered
                        });
                    }
                });
            }

            return {
                type: "branch",
                or: prefixBranches,
                label: `needs at least ${requiredCount} modules from:`
            };
        }

        // Process standard structural "and" or "or" branches
        const mutatedNode: FormattedPreReqNode = { type: "branch" };

        if ("and" in structuralTemplate && Array.isArray(structuralTemplate.and)) {
            mutatedNode.and = structuralTemplate.and.map(child => 
                formatTree(child, allValidCodes)
            );
        }
        if ("or" in structuralTemplate && Array.isArray(structuralTemplate.or)) {
            mutatedNode.or = structuralTemplate.or.map(child => 
                formatTree(child, allValidCodes)
            );
        }

        // Fallback for custom text-based prerequisite blocks just in case
        const fallbackChildren = structuralTemplate.requirements || structuralTemplate.child;
        if (!mutatedNode.and && !mutatedNode.or && Array.isArray(fallbackChildren)) {
            mutatedNode.or = fallbackChildren.map(child => formatTree(child, allValidCodes));
        }

        // Retain labels if present
        if ("label" in structuralTemplate && typeof structuralTemplate.label === "string") {
            mutatedNode.label = structuralTemplate.label;
        }

        return mutatedNode;
    }

    return { type: "leaf", moduleCode: "" };
}