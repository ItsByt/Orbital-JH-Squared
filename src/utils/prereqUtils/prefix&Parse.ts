import type { FormattedPreReqNode } from "@/types";

// INFO: The two helpers abstract the two cases of prefix handling

// Helper that takes in the node with "nOf" tree structure and list of NUS codes
// and finds matching codes to the prefix found in nOf's {}, then returns a node containing the matches
export function createPrefixBranch(prefix: string, allValidCodes: string[]): FormattedPreReqNode {
    const cleanPrefix = prefix.split(":")[0].replace(/%/g, "").trim();
    const discovered = allValidCodes
        .filter((code) => code.startsWith(cleanPrefix))
        .sort();

    return {
        type: "prefix-branch",
        prefixLabel: `Courses beginning with ${cleanPrefix}`,
        or: [],
        allPossibleMatches: discovered,
    };
}

// Helper that takes in a node that is a string and list of NUS codes.
// If exact module code, return string as a regular leaf node, otherwise for rule based strings,
// find matching codes to the prefix set by rule and returns a node containing the matches
export function parseStringRule(node: string, allValidCodes: string[]): FormattedPreReqNode {
    const formattedText = node.split(":")[0].replace(/\\"/g, '"').trim();
    const extractedPrefixes = node.match(/[A-Z]{2,4}\d{4}%?/); // hard coded might want to expand??
    const hasWildcardPrefix = extractedPrefixes?.some(p => p.includes("%"));
    
    if (hasWildcardPrefix && extractedPrefixes) {
        let requiredCount: string | null = null;
        const coursesMatch = formattedText.match(/COURSES\s*\((\d+)\)/i);
        const atLeastMatch = formattedText.match(/at least\s*(\d+)/i);
        
        if (coursesMatch) requiredCount = coursesMatch[1];
        else if (atLeastMatch) requiredCount = atLeastMatch[1];

        return {
            type: "branch",
            or: extractedPrefixes.map(p => createPrefixBranch(p, allValidCodes)),
            label: requiredCount ? `needs at least ${requiredCount} modules from` : `needs any of`
        };
    }

    return {
        type: "branch",
        label: " ",
        and: [{ type: "leaf", moduleCode: formattedText }]
    };
}