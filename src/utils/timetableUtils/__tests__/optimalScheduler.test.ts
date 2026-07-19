import { describe, it, expect } from 'vitest';
import { findBestFit } from '../optimalScheduler';
import type { DisplayLesson, NUSModsRawLesson } from '@/types';

// Helper to create raw lessons (simulating input from NUSMods API)
function createRaw(lessonType: string, classNo: string, start: string, end: string): NUSModsRawLesson {
    return {
        classNo,
        lessonType,
        startTime: start,
        endTime: end,
        day: 'Monday',
        venue: 'LT1',
        weeks: [1] // Corresponds to weekBitmask 0b1
    };
}

// Helper to create valid DisplayLessons matching the interface
function hhmmToMinutes(time: number): number {
    const hours = Math.floor(time / 100);
    const minutes = time % 100;
    return hours * 60 + minutes;
}

function createDisplay(
    id: string,
    start: number,
    end: number,
    lessonType: string = 'LEC',
    classNo: string = '1'
): DisplayLesson {
    return {
        id,
        moduleCode: 'CS2040S',
        lessonType,
        classNo,
        day: 'Monday',
        startTime: start.toString().padStart(4, '0'),
        endTime: end.toString().padStart(4, '0'),
        venue: 'LT1',
        weeks: [1],
        startMins: hhmmToMinutes(start),
        endMins: hhmmToMinutes(end),
        weekBitmask: 0b1,
    };
}

describe('findBestFit', () => {
    it('should select a conflict-free configuration', () => {
        const currentTimetable: DisplayLesson[] = [createDisplay('fixed', 900, 1000)];
        const newSlots: NUSModsRawLesson[] = [
            createRaw('LEC', '1', '1000', '1100'),
            createRaw('TUT', '1', '1200', '1300')
        ];

        const result = findBestFit('CS2040S', newSlots, currentTimetable);
        
        expect(result).toHaveLength(2);
        expect(result.some(l => l.lessonType === 'LEC')).toBe(true);
        expect(result.some(l => l.lessonType === 'TUT')).toBe(true);
    });

    it('should prioritize the option with fewer clashes', () => {
        // Fixed lesson occupies 0900-1100
        const currentTimetable: DisplayLesson[] = [createDisplay('fixed', 900, 1100, 'LEC', '0')];
        
        const newSlots: NUSModsRawLesson[] = [
            // Option 1: Clashes with fixed (1000-1200 overlaps 0900-1100)
            createRaw('LEC', '1', '1000', '1200'),
            // Option 2: Safe (1300-1400)
            createRaw('LEC', '2', '1300', '1400')
        ];

        const result = findBestFit('CS2040S', newSlots, currentTimetable);
        
        // Find the LEC lesson and check if it chose the safe one (class '2')
        const lecLesson = result.find(l => l.lessonType === 'LEC');
        
        expect(lecLesson).toBeDefined();
        expect(lecLesson?.classNo).toBe('2');
    });
});