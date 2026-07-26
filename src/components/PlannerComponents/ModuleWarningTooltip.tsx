import { TriangleAlert } from "lucide-react";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import MissingPrereqTreeRenderer from "./MissingPrereqRenderer";
import { formatSemesterKeyReadable } from "@/utils/plannerUtils/semesterKeyUtils";
import type { TrimmedPrereqResult } from "@/utils/plannerUtils/plannerPreReqUtils";

interface Props {
    testId?: string;
    takenTooEarlyIssues: TrimmedPrereqResult | null;
    boardMap: Record<string, { time: number; semKey: string }>; // HashMap of Module Code to (Absolute Time, semKey}
    targetTime: number;
    takenTooLateIssues: { modCode: string; semKey: string; time: number }[];
}

function WarningSection({
    testId,
    title,
    colorClass,
    children,
}: {
    testId?: string;
    title: string;
    colorClass: string;
    children: React.ReactNode;
}) {
    return (
        <div data-testid={testId} className="flex flex-col gap-1.5">
            <div
                className={cn(
                    "font-bold flex items-start gap-1.5 text-[13px] leading-tight",
                    colorClass
                )}
            >
                <TriangleAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{title}</span>
            </div>
            {children}
        </div>
    );
}

export default function ModuleWarningTooltip({
    testId,
    takenTooEarlyIssues,
    boardMap,
    targetTime,
    takenTooLateIssues,
}: Props) {
    // If no issues for it being Too Early or Too Late
    if (takenTooEarlyIssues === null && takenTooLateIssues.length === 0) return null;

    const hasMissing = takenTooEarlyIssues?.hasMissing || false;
    const isMisplacedOnly = takenTooEarlyIssues?.hasMisplaced && !hasMissing;
    const isRedIcon = hasMissing;

    return (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        data-testid={testId}
                        className={cn(
                            "rounded-sm p-0.5 cursor-help shadow-md border shrink-0",
                            isRedIcon
                                ? "bg-red-500/90 border-red-700 text-white"
                                : "bg-[#F5C519] border-amber-500/50 text-amber-950"
                        )}
                    >
                        <TriangleAlert className="h-3 w-3" />
                    </div>
                </TooltipTrigger>
                <TooltipContent
                    side="right"
                    sideOffset={12}
                    className="bg-zinc-950 border-zinc-700 shadow-xl z-[100]"
                >
                    <div className="flex flex-col gap-4 max-w-[280px] p-2 break-words whitespace-normal">
                        {/* Completely Missing from Planner */}
                        {hasMissing && takenTooEarlyIssues?.tree && (
                            <WarningSection
                                testId="warning-section-missing"
                                title="These courses are missing from your planner:"
                                colorClass="text-red-400"
                            >
                                <MissingPrereqTreeRenderer
                                    tree={takenTooEarlyIssues.tree}
                                    boardMap={boardMap}
                                    targetTime={targetTime}
                                />
                            </WarningSection>
                        )}

                        {/* In Planner, but taken too early */}
                        {isMisplacedOnly && takenTooEarlyIssues?.tree && (
                            <WarningSection
                                title="This module relies on the following courses. Consider taking this module in a later year and semester:"
                                colorClass="text-amber-400"
                            >
                                <MissingPrereqTreeRenderer
                                    tree={takenTooEarlyIssues.tree}
                                    boardMap={boardMap}
                                    targetTime={targetTime}
                                />
                            </WarningSection>
                        )}

                        {/* Divider between Too Early and Too Late issues */}
                        {takenTooEarlyIssues && takenTooLateIssues.length > 0 && (
                            <div className="w-full h-px bg-zinc-800" />
                        )}

                        {/* In Planner, but taken too late */}
                        {takenTooLateIssues.length > 0 && (
                            <WarningSection
                                title="The following courses rely on this module. Consider taking this module in an earlier year and semester:"
                                colorClass="text-amber-400"
                            >
                                <ul className="list-disc pl-4 space-y-1 text-[12px]">
                                    {takenTooLateIssues.map((issue, i) => (
                                        <li key={i}>
                                            <span className="whitespace-nowrap inline-block text-amber-500">
                                                <span className="font-bold">{issue.modCode}</span>
                                                <span className="font-medium ml-1">
                                                    ({formatSemesterKeyReadable(issue.semKey)})
                                                </span>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </WarningSection>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
