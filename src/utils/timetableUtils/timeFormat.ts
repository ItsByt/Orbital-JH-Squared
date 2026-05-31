export function timeToMins(timeString: string): number {
    if (!timeString) return 0;
    const hours = parseInt(timeString.substring(0, 2), 10);
    const minutes = parseInt(timeString.substring(2, 4), 10);
    return hours * 60 + minutes;
}

export const convertTimeToColumn = (timeString: string): number => {
    const hour = parseInt(timeString.substring(0, 2), 10);
    const minute = parseInt(timeString.substring(2, 4), 10);
    const baseHour = 8;
    const hourDiff = hour - baseHour;
    const minuteFraction = minute / 60;

    return 1 + hourDiff * 2 + Math.floor(minuteFraction * 2);
};
