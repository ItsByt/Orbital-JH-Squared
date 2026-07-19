import { describe, it, expect } from 'vitest';
import { timeToMins, convertTimeToColumn } from '@/utils/timetableUtils/timeFormat';

describe('Time Format Utilities', () => {
    it('should convert time string to minutes correctly', () => {
        expect(timeToMins('1000')).toBe(600);
        expect(timeToMins('1430')).toBe(870);
    });

    it('should convert time to grid column', () => {
        // 0900 is 4 hours after 0500, with 2 columns per hour
        expect(convertTimeToColumn('0900')).toBe(8); 
        expect(convertTimeToColumn('0930')).toBe(9);
    });
});