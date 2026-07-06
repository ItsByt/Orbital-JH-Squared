import AutoCompleteSearch from "@/hooks/GeneralHooks/useModuleSearch";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface SearchBarProps {
    onSelect: (moduleCode: string) => void;
    targetSemester?: number;
}

export default function SearchBar({ onSelect, targetSemester }: SearchBarProps) {
    const { searchTerm, setSearchTerm, searchResults, setSearchResults, isLoading } =
        AutoCompleteSearch(targetSemester);
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="w-full max-w-3xl mx-auto relative">
            {/* Search Bar */}
            <div className="relative">
                <Input
                    placeholder="Search modules (e.g., CS1231S or Discrete Structures)"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    disabled={isLoading}
                    className="w-full h-16 py-6 pl-6 pr-14 text-xl rounded-2xl border border-border bg-card text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#56A58B] focus-visible:border-transparent shadow-md transition-all duration-200"
                />
                {isLoading && (
                    <Loader2 className="absolute right-3 top-2.5 h-5 w-5 animate-spin text-muted-foreground" />
                )}
            </div>

            {/* Autocomplete Dropdown */}
            {isOpen && searchResults.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((mod) => (
                        <li
                            key={mod.moduleCode}
                            className="px-4 py-2 hover:bg-border/50 cursor-pointer border-b border-border last:border-none transition-colors duration-150"
                            onClick={() => {
                                console.log("User selected:", mod.moduleCode);
                                setSearchTerm(mod.moduleCode);
                                setSearchResults([]);
                                setIsOpen(false);

                                //Trigger selection function on click
                                onSelect(mod.moduleCode);
                            }}
                        >
                            <div className="font-bold text-foreground">{mod.moduleCode}</div>
                            <div className="text-sm text-muted-foreground truncate">
                                {mod.title}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
