import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Search, Loader2 } from "lucide-react";
import AutoCompleteSearch from "@/hooks/useModuleSearch";
import { usePlannerStore } from "@/store/usePlannerStore";
import { getModule } from "@/services/nusmods";
import { buildPlannerModule } from "@/utils/plannerUtils/moduleFormatters";
import { toast } from "sonner";

export default function AddCourseModal(
    { open, onOpenChange, semesterKey} : 
    { open: boolean, onOpenChange: (open: boolean) => void, semesterKey: string})  {

        const { searchTerm, setSearchTerm, searchResults, isLoading } = AutoCompleteSearch();
        const addModule = usePlannerStore(state => state.addModule);

        const handleSelectModule = async (moduleCode: string) => {
            const board = usePlannerStore.getState().board;
            const isDuplicate = Object.values(board).some(semesterArray => 
                semesterArray.some(mod => mod.moduleCode == moduleCode)
            );

            if (isDuplicate) {
                toast.error(`${moduleCode} is already in your planner!`);
                return;
            }

            const moduleDetails = await getModule(moduleCode);
            if (moduleDetails) {
                const newModule = buildPlannerModule(moduleDetails);
                addModule(semesterKey, newModule);
                onOpenChange(false);
                setSearchTerm("");
            }
        };


        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[450px] bg-[#18181b] border-zinc-800 p-0 overflow-hidden gap-0">
                    <DialogHeader className="p-4 border-b border-zinc-800">
                        <div className="flex items-center gap-3">
                            <Search className="h-4 w-4 text-zinc-500" />
                            <input 
                                className="bg-transparent border-none outline-none text-zinc-200 text-sm w-full"
                                placeholder="Search module code or title..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                            {isLoading && <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />}
                        </div>
                    </DialogHeader>
                    
                    <div className="max-h-[300px] overflow-y-auto p-2">
                        {searchResults.length === 0 && searchTerm && !isLoading && (
                            <p className="text-center py-4 text-xs text-zinc-500">No modules found.</p>
                        )}
                        {searchResults.map((mod) => (
                            <button
                                key={mod.moduleCode}
                                onClick={() => handleSelectModule(mod.moduleCode)}
                                className="w-full text-left p-3 hover:bg-zinc-800/50 rounded-md transition-colors flex flex-col group cursor-pointer"
                            >
                                <span className="text-xs font-bold text-[#56A58B]">{mod.moduleCode}</span>
                                <span className="text-[11px] text-zinc-400 group-hover:text-zinc-200">{mod.title}</span>
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
    );
}