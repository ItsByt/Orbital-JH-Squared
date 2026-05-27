import SearchBar from "@/components/SearchBar";
import { useState } from "react";
import { getModule } from "@/services/nusmods";
import type { ModuleDetails } from "@/types"
import { Loader2 } from "lucide-react";
import ModuleDetailsCard from "@/components/ModuleDetailsCard"

export default function Courses() {
    // Initialize variable with state to store description state (or null)
    // Initialize state boolean for fetching status similar to loading
    const [selectedModule, setSelectedModule] = useState<ModuleDetails | null>(null);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);

    // Handle Selection logic
    const handleModuleSelect = async (moduleCode: string) => {
        setIsFetchingDetails(true);
        // reset previous selection
        setSelectedModule(null);

        const desc = await getModule(moduleCode);
        setSelectedModule(desc);
        setIsFetchingDetails(false);

    };

    return (
        <div className="space-y-6">
            <div>
                <h1
                className="text-4xl font-bold"
                style={{
                fontFamily: "Bahnschrift, sans-serif",
                color: "#56A58B"}}
                >
                Course Information
                </h1>
            </div>

            <div className="w-full max-w-4xl mx-auto mt-6">
                <SearchBar onSelect={handleModuleSelect} />
            </div>

            {isFetchingDetails && (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            )}

            {/* Using the ModuleDetailsCard component for displaying module details */}
            {selectedModule && (
                <ModuleDetailsCard module={selectedModule} />
            )}
        </div>
    );
}
