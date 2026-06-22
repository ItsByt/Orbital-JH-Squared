import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { getCurrentAcadYear } from "@/utils/generalUtils/time";
import type { ModuleDetails, NUSModsRawLesson } from "@/types"; ;
import { addToTimetable, removeFromTimetable, isInTimetable } from "@/services/timetableDB";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/generalUtils/getErrorMessage";

export default function ModuleDetailsCard({ module }: { module: ModuleDetails }) {
    const queryClient = useQueryClient();
    const currentYear = getCurrentAcadYear();

    const isProcessingRef = useRef(false);

    // 1. Check Database for Sem 1 Status
    const { data: isAddedSem1 = false, isLoading: isLoadingSem1 } = useQuery({
        queryKey: ["timetableStatus", module.moduleCode, currentYear, 1],
        queryFn: () => isInTimetable(module.moduleCode, currentYear, 1),
    });

    // 2. Check Database for Sem 2 Status
    const { data: isAddedSem2 = false, isLoading: isLoadingSem2 } = useQuery({
        queryKey: ["timetableStatus", module.moduleCode, currentYear, 2],
        queryFn: () => isInTimetable(module.moduleCode, currentYear, 2),
    });

    // Database Mutation (Handles Add/Remove for either semester)
    const toggleMutation = useMutation({
        mutationFn: async ({
            semester,
            isAdded,
            timetable,
        }: {
            semester: number;
            isAdded: boolean;
            timetable: NUSModsRawLesson[];
        }) => {
            if (isAdded) {
                await removeFromTimetable(module.moduleCode, currentYear, semester);
                return { semester, action: "removed" };
            } else {
                await addToTimetable(module.moduleCode, timetable, currentYear, semester);
                return { semester, action: "added" };
            }
        },
        onSuccess: async (data) => {
            toast.success(
                data.action === "added"
                    ? `Added to Semester ${data.semester}`
                    : `Removed from Semester ${data.semester}`
            );

            // Invalidate queries to sync other pages
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: ["timetableStatus", module.moduleCode],
                }),
                queryClient.invalidateQueries({
                    queryKey: ["timetable", currentYear, data.semester],
                })
            ]);
        },
        onError: (error, variables) => {
            toast.error(`Failed to update Semester ${variables.semester}`, {
                description: getErrorMessage(error),
            });
        },
        onSettled: () => {
            isProcessingRef.current = false;
        },
    });

    const handleToggle = (semester: number, isAdded: boolean, timetable: NUSModsRawLesson[]) => {
        if (isProcessingRef.current) return;

        isProcessingRef.current = true;

        // Trigger the database update
        toggleMutation.mutate({ semester, isAdded, timetable });
    };

    const offeredSem1 = module.semesterData?.find((s) => s.semester === 1);
    const offeredSem2 = module.semesterData?.find((s) => s.semester === 2);

    const isProcessing = toggleMutation.isPending;
    const processedSemester = toggleMutation.variables?.semester;

    return (
        <div className="p-6 bg-card border border-border rounded-xl shadow-sm space-y-4 text-sm text-muted-foreground leading-relaxed transition-colors duration-200">
            <div className="flex justify-between items-start border-b border-border pb-3">
                <div>
                    <span className="font-bold text-foreground tracking-wide">
                        {module.moduleCode}
                    </span>
                    <h2 className="text-xl font-bold text-foreground mt-0.5">{module.title}</h2>
                </div>
                <span className="font-semibold text-foreground shrink-0">
                    {module.moduleCredit} MCs
                </span>
            </div>

            {/* Semester Action Buttons */}
            <div className="flex gap-2">
                {offeredSem1 && (
                    <button
                        onClick={() =>
                            handleToggle(
                                1,
                                isAddedSem1,
                                offeredSem1.timetable as NUSModsRawLesson[]
                            )
                        }
                        disabled={isProcessing || isLoadingSem1}
                        className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-white transition 
                            ${isProcessing || isLoadingSem1 ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}
                            ${isAddedSem1 ? "bg-red-500 hover:bg-red-600" : "bg-[#749c83] hover:bg-[#638570]"}`}
                    >
                        {isProcessing && processedSemester === 1 && (
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        )}
                        {isLoadingSem1
                            ? "Checking..."
                            : isAddedSem1
                              ? "Remove from Sem 1"
                              : "Add to Sem 1"}
                    </button>
                )}

                {offeredSem2 && (
                    <button
                        onClick={() =>
                            handleToggle(
                                2,
                                isAddedSem2,
                                offeredSem2.timetable as NUSModsRawLesson[]
                            )
                        }
                        disabled={isProcessing || isLoadingSem2}
                        className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-white transition 
                            ${isProcessing || isLoadingSem2 ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}
                            ${isAddedSem2 ? "bg-red-500 hover:bg-red-600" : "bg-[#749c83] hover:bg-[#638570]"}`}
                    >
                        {isProcessing && processedSemester === 2 && (
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        )}
                        {isLoadingSem2
                            ? "Checking..."
                            : isAddedSem2
                              ? "Remove from Sem 2"
                              : "Add to Sem 2"}
                    </button>
                )}
            </div>

            {/* Module Description Paragraph */}
            <p className="text-sm text-muted-foreground leading-relaxed">
                {module.description || "No description provided for this module."}
            </p>
        </div>
    );
}
