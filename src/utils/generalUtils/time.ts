export function getCurrentAcadYear(): number {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); //0-indexed, so Jan is 0

    if (currentMonth >= 7) {
        return currentYear;
    } else {
        return currentYear - 1;
    }
}

// Formats it as AY1122/23
export function getAcadYearStringSlash(): string {
    const year = getCurrentAcadYear();
    return `AY${year}/${(year % 100) + 1}`;
}

// Formats it as 1122-1123
export function getAcadYearStringDash(): string {
    const year = getCurrentAcadYear();
    return `${year}-${year + 1}`;
}

// Returns only Semester 1 and 2
export function getCurrentAcadSem(): number {
    const now = new Date();
    const currentMonth = now.getMonth(); //0-indexed, so Jan is 0

    if (currentMonth >= 7) {
        return 1;
    } else {
        return 2;
    }
}
