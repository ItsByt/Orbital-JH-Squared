import { ChevronDown, Trash2  } from "lucide-react";
import type { PlannerModule } from "@/types";
import { usePlannerStore } from "@/store/usePlannerStore";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ModuleBlockProps {
    module: PlannerModule;
    semesterKey: string;
}

export default function ModuleBlock({ module, semesterKey }: ModuleBlockProps) {
    const removeModule = usePlannerStore(state => state.removeModule);

    return (
        // Block background, text color, and hover effects
        <div 
            className="relative group bg-[#3070b3] 
            hover:bg-[#28619e] text-black p-2.5 rounded-md 
            shadow-sm transition-colors duration-150 
            cursor-grab active:cursor-grabbing 
            flex flex-col"
        >
            
            <div className="flex justify-between items-start mb-1">
                <span className="text-[12px] font-bold tracking-tight leading-none">
                    {module.moduleCode}
                </span>

                {/* Dropdown Menu triggered by Chevron */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="hover:bg-black/20 rounded p-0.5 transition-colors cursor-pointer outline-none">
                            <ChevronDown size={14} className="text-white/80" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 bg-[#18181a] border-zinc-800 text-zinc-300">

                        {/* Removing a module */}
                        <DropdownMenuItem 
                            onClick={() => removeModule(semesterKey, module.moduleCode)}
                            className="text-red-400 focus:text-red-400 focus:bg-red-400/10 cursor-pointer"
                        >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            <span>Remove Module</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <span className="text-[10px] font-medium leading-[1.2] text-black/90 line-clamp-2 pr-2">
                {module.title}
            </span>

            <div className="mt-2 flex justify-start text-[10px] font-medium text-white/70">
                <span>{module.moduleCredit} Units</span>
            </div>
        </div>
    );
}
