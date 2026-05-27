import AutoCompleteSearch from "@/hooks/moduleSearch";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function SearchBar({ onSelect }: { onSelect: (moduleCode: string) => void }) {
    const { searchTerm, setSearchTerm, searchResults, setSearchResults, isLoading } = AutoCompleteSearch();
    const [isOpen, setIsOpen] = useState(false);
    
    return (
        <div className="w-full max-w-md mx-auto relative">

            {/* Search Bar */}
            <div className="relative">
                <Input
                    placeholder="Search modules (e.g., CS1231S or Discrete Structures)"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setIsOpen(true);
                    }}
                    disabled={isLoading}
                />
                {isLoading && <Loader2 className="absolute right-3 top-2.5 h-5 w-5 animate-spin text-gray-400" />}
            </div>

            {/* Autocomplete Dropdown */}
            {isOpen && searchResults.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((mod) => (
                        <li
                            key={mod.moduleCode}
                            className="px-4 py-2 hover:bg-slate-100 cursor-pointer border-b last:border-none"
                            onClick={() => {
                                console.log("User selected:", mod.moduleCode);
                                setSearchTerm(mod.moduleCode);
                                setSearchResults([]); 
                                setIsOpen(false); 

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

