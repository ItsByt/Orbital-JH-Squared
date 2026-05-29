import { useState, useEffect } from "react";
import { getModuleList } from "@/services/nusmods";
import type { ModuleSummary } from "@/types"

export default function AutoCompleteSearch() {
    const [allModules, setAllModules] = useState<ModuleSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<ModuleSummary[]>([]);

    //"Downloads" all ModuleSummaries exactly once for quick searching
    useEffect(() => {
        async function fetchList() {
            const data = await getModuleList("2025-2026");
            setAllModules(data);
            setIsLoading(false);
        }
        fetchList();
    }, []);

    //Autocomplete Logic for searching module codes
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setSearchResults([]);
            return;
        }

        const lowerCaseSearch = searchTerm.toLowerCase();

        //Filtering through the array of ModuleSummary
        const filtered = allModules.filter((mod) =>
            mod.moduleCode.toLowerCase().includes(lowerCaseSearch) ||
            mod.title.toLowerCase().includes(lowerCaseSearch)
        );

        filtered.sort((a, b) => {
            const aCode = a.moduleCode.toLowerCase();
            const bCode = b.moduleCode.toLowerCase();

            const aExact = aCode === lowerCaseSearch;
            const bExact = bCode === lowerCaseSearch;

            const aStartsWith = aCode.startsWith(lowerCaseSearch);
            const bStartsWith = bCode.startsWith(lowerCaseSearch);

            const aIncludes = aCode.includes(lowerCaseSearch);
            const bIncludes = bCode.includes(lowerCaseSearch);

            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;

            if (aStartsWith && !bStartsWith) return -1;
            if (bStartsWith && !aStartsWith) return 1;

            if (aIncludes && !bIncludes) return -1;
            if (bIncludes && !aIncludes) return 1;

            return aCode.localeCompare(bCode);
        });
        // Only keep top 10 results
            setSearchResults(filtered.slice(0, 10));
    }, [searchTerm, allModules]);

    return {
        searchTerm,
        setSearchTerm,
        searchResults,
        setSearchResults,
        isLoading
    };
}


