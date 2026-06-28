import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SearchBar from "@/components/GeneralComponents/SearchBar";
import { getModule } from "@/services/nusmods";
import ModuleDetailsCard from "@/components/CoursesComponents/ModuleDetailsCard";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/generalUtils/getErrorMessage";

export default function Courses() {
    // Initialize variable with state to store module code (or null)
    const [selectedModuleCode, setSelectedModuleCode] = useState<string | null>(null);

    const {
        data: selectedModule,
        isFetching,
        isError,
        error,
    } = useQuery({
        queryKey: ["module", selectedModuleCode],
        queryFn: () => getModule(selectedModuleCode!),

        // Double Exclamation mark to convert it to boolean
        // Only fetch data if a module is selected
        enabled: !!selectedModuleCode,
        staleTime: 1000 * 60 * 5,
    });

    // Handle Selection logic
    useEffect(() => {
        if (isError) {
            toast.error("Failed to load module", { description: getErrorMessage(error) });
        } else if (selectedModuleCode && !isFetching && selectedModule === null) {
            // Null means the fetch succeeded, but NUSMods couldn't find the module
            toast.error(`Could not find details for ${selectedModuleCode}`);
        }
    }, [isError, error, selectedModule, isFetching, selectedModuleCode]);

    return (
        <div className="space-y-6 flex flex-col px-6 pt-4 h-full">
            <div>
                <h1
                    className="text-4xl font-bold"
                    style={{ fontFamily: "Bahnschrift, sans-serif", color: "#56A58B" }}
                >
                    Course Information
                </h1>
            </div>

            <div className="w-full max-w-4xl mx-auto mt-6">
                <SearchBar onSelect={setSelectedModuleCode} />
            </div>

            {isFetching && (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-[#749c83]" />
                </div>
            )}

            {/* Using the ModuleDetailsCard component for displaying module details */}
            {selectedModule && !isFetching && <ModuleDetailsCard module={selectedModule} />}
        </div>
    );
}
