import { useState, useEffect } from "react";
import { getModuleList } from "@/services/nusmods";
import type { ModuleSummary} from "@/services/nusmods";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

//Mod Select property to define in each page
interface AutocompleteSearchProps {
    onSelect: (moduleCode: string) => void;
}

export default function AutocompleteSearch({ onSelect }: AutocompleteSearchProps) {
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
    
    return (
        <div className="w-full max-w-md mx-auto relative">

            {/* Search Bar */}
            <div className="relative">
                <Input
                    placeholder="Search modules (e.g., CS1231S or Discrete Structures)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={isLoading}
                />
                {isLoading && <Loader2 className="absolute right-3 top-2.5 h-5 w-5 animate-spin text-gray-400" />}
            </div>

            {/* Autocomplete Dropdown */}
            {searchResults.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((mod) => (
                        <li
                            key={mod.moduleCode}
                            className="px-4 py-2 hover:bg-slate-100 cursor-pointer border-b last:border-none"
                            onClick={() => {
                                console.log("User selected:", mod.moduleCode);
                                setSearchTerm(mod.moduleCode);
                                setSearchResults([]); 

                                //Trigger selection function on click
                                onSelect(mod.moduleCode);
                            }}
                        >
                            <div className="font-bold text-blue-600">{mod.moduleCode}</div>
                            <div className="text-sm text-gray-600 truncate">{mod.title}</div>
                        </li>
                    ))}
                </ul>
            )}

        </div>
    );
}

