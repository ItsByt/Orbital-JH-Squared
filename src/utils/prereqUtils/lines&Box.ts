//---------------------------------------------------------------------------------------------------------
// G U I D E:
// Helper to assign correct automatically rescalable horizontal connector to module based on relative index
// Constants for box colors dependent on is_Expanded, constant for all line connectors' color
//---------------------------------------------------------------------------------------------------------

export const getConnector = (index: number, length: number): string => {
    if (length <= 1) return "";
    if (index === 0) return "left-1/2 right-0";
    if (index === length - 1) return "left-0 right-1/2";
    return "left-0 right-0";
};

export function getBoxColor(isExpanded: boolean): string {
    return isExpanded
        ? "bg-[#E8A753] text-black border-[#cf9043]"
        : "bg-[#719E8E] text-white border-[#5d8275]";
}

export const connectorStyle = "bg-zinc-400 dark:bg-zinc-600";
