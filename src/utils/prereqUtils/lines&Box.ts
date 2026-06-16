export const getBoxColor = (isRoot: boolean, isMandatory: boolean): string => {
    if (isRoot) return "bg-[#E8A753] text-black border-[#cf9043]";
    if (isMandatory) return "bg-[#719E8E] text-white border-[#5d8275]";
    return "bg-white dark:bg-zinc-800 text-foreground border-zinc-400 dark:border-zinc-600";
};

export const getConnector = (index: number, length: number): string => {
    if (length <= 1) return "";
    if (index === 0) return "left-1/2 right-0";
    if (index === length - 1) return "left-0 right-1/2";
    return "left-0 right-0";
};