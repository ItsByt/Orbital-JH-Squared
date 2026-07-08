import { PrereqTree } from "@/types";
import { Fragment } from "react/jsx-runtime";
import { cn } from "@/lib/utils";
import { formatSemesterKeyReadable } from "@/utils/plannerUtils/semesterKeyUtils";
import { removeModuleCodeGrade, removeModuleCodeWildCard } from "@/utils/plannerUtils/prereqUtils";

interface PrereqRendererProps {
    tree: PrereqTree;
    boardMap: Record<string, { time: number; semKey: string }>; // HashMap of Module Code to (Absolute Time, semKey)
    targetTime: number;
}

type RenderContext = {
    nOfColor?: string;
};

export default function MissingPrereqTreeRenderer({
    tree,
    boardMap,
    targetTime,
}: PrereqRendererProps) {
    if (!tree) return null;

    const renderNode = (node: PrereqTree, context?: RenderContext): React.ReactNode => {
        if (!node) return null;

        if (typeof node === "string") {
            const cleanCode = removeModuleCodeGrade(node);
            const hasWildcard = cleanCode.includes("%");

            if (hasWildcard) {
                const prefix = removeModuleCodeWildCard(cleanCode);
                const matchingCodes = Object.keys(boardMap).filter((modCode) =>
                    modCode.startsWith(prefix)
                );
                const validCount = matchingCodes.filter(
                    (modCode) => boardMap[modCode].time < targetTime
                ).length;

                const misplacedCount = matchingCodes.filter(
                    (modCode) => boardMap[modCode].time >= targetTime
                ).length;

                let textColorClass = "text-red-400 font-bold";

                // If we passed down its color, use it,
                // else we dynamically assign text color based on the module's state
                if (context?.nOfColor) {
                    textColorClass = context.nOfColor;
                } else {
                    if (validCount > 0) textColorClass = "text-emerald-500 font-medium";
                    else if (misplacedCount > 0) textColorClass = "text-amber-500 font-bold";
                }

                return (
                    <span className="leading-tight break-words whitespace-normal">
                        <span className={textColorClass}>Any course starting with "{prefix}"</span>
                        <span className="ml-1 font-medium opacity-90 text-zinc-400 text-[11px]">
                            ({validCount} valid
                            {misplacedCount > 0 ? `, ${misplacedCount} too late` : ""})
                        </span>
                    </span>
                );
            }

            const nodeData = boardMap[cleanCode];
            const isTaken = nodeData !== undefined;
            const isValid = isTaken && nodeData.time < targetTime;

            // We dynamically assign text color based on the module's state
            let textColorClass = "text-red-400 font-bold"; // Default: Missing
            if (isValid) {
                textColorClass = "text-emerald-500 font-medium"; // Valid
            } else if (isTaken) textColorClass = "text-amber-500 font-semibold"; // Misplaced

            return (
                <span className={`whitespace-nowrap inline-block ${textColorClass}`}>
                    <span className="font-bold">{cleanCode}</span>

                    {/* Append the Semester string if it is already on the board */}
                    {isTaken && (
                        <span className="ml-1 font-medium opacity-90">
                            ({formatSemesterKeyReadable(nodeData.semKey)})
                        </span>
                    )}
                </span>
            );
        }

        if ("or" in node) {
            return (
                <span className="inline">
                    {node.or.map((child, i) => (
                        // Fragment to wrap and keep all text in one continuous line
                        <Fragment key={i}>
                            {/* i > 0 to skip the first "or" for the first item */}
                            {i > 0 && <span className="text-zinc-500 mx-1">or</span>}
                            {renderNode(child)}
                        </Fragment>
                    ))}
                </span>
            );
        }

        if ("and" in node) {
            return (
                <span className="inline">
                    <span className="text-zinc-500 mr-0.5">(</span>
                    {node.and.map((child, i) => (
                        <Fragment key={i}>
                            {i > 0 && <span className="text-zinc-500 mx-1">and</span>}
                            {renderNode(child)}
                        </Fragment>
                    ))}
                    <span className="text-zinc-500 ml-0.5">)</span>
                </span>
            );
        }

        if ("nOf" in node) {
            const requiredCount = node.nOf[0];

            let validCount = 0;
            let misplacedCount = 0;

            const evaluateChildStatus = (
                child: PrereqTree
            ): "VALID" | "MISPLACED" | "MISSING" | "WILDCARD" => {
                if (!child) return "MISSING";

                if (typeof child === "string") {
                    const cleanCode = removeModuleCodeGrade(child).trim();
                    if (cleanCode.includes("%")) return "WILDCARD"; // We handle wildcards specially

                    const data = boardMap[cleanCode];
                    if (!data) return "MISSING";
                    return data.time < targetTime ? "VALID" : "MISPLACED";
                }
                if ("or" in child) {
                    const stats = child.or.map(evaluateChildStatus);
                    if (stats.includes("VALID")) return "VALID";
                    if (stats.includes("MISPLACED")) return "MISPLACED";
                    return "MISSING";
                }
                if ("and" in child) {
                    const stats = child.and.map(evaluateChildStatus);
                    if (stats.includes("MISSING")) return "MISSING";
                    if (stats.includes("MISPLACED")) return "MISPLACED";
                    return "VALID";
                }

                return "MISSING";
            };

            const requiredChildren = node.nOf[1];
            requiredChildren.forEach((child) => {
                const status = evaluateChildStatus(child);

                if (status === "WILDCARD" && typeof child === "string") {
                    const prefix = removeModuleCodeWildCard(child).trim();
                    const matchingCodes = Object.keys(boardMap).filter((modCode) =>
                        modCode.startsWith(prefix)
                    );
                    validCount += matchingCodes.filter(
                        (modCode) => boardMap[modCode].time < targetTime
                    ).length;
                    misplacedCount += matchingCodes.filter(
                        (modCode) => boardMap[modCode].time >= targetTime
                    ).length;
                } else if (status === "VALID") {
                    validCount++;
                } else if (status === "MISPLACED") {
                    misplacedCount++;
                }
            });

            const totalCount = validCount + misplacedCount;
            let headerColor = "text-red-400 font-bold";
            if (validCount >= requiredCount) headerColor = "text-emerald-500 font-medium";
            else if (totalCount >= requiredCount) headerColor = "text-amber-500 font-bold";

            return (
                <div className="mt-1.5 flex flex-col">
                    <span className={cn("italic", headerColor)}>
                        Take at least {requiredCount} of the following (Have {validCount} valid
                        {misplacedCount > 0 ? `, ${misplacedCount} too late` : ""}):
                    </span>
                    <ul className="list-disc pl-5 mt-1 border-l border-zinc-700/50 ml-1 space-y-1">
                        {requiredChildren.map((child, idx) => (
                            <li key={idx}>{renderNode(child, { nOfColor: headerColor })}</li>
                        ))}
                    </ul>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="text-[12px] leading-relaxed break-words whitespace-normal text-zinc-300">
            {typeof tree === "object" && "and" in tree ? (
                <ul className="list-disc pl-4 space-y-1">
                    {/* To create separate bullet points in "and" (requires all) scenario */}
                    {tree.and.map((child, idx) => (
                        <li key={idx}>{renderNode(child)}</li>
                    ))}
                </ul>
            ) : (
                <ul className="list-disc pl-4 space-y-1">
                    <li>{renderNode(tree)}</li>
                </ul>
            )}
        </div>
    );
}
