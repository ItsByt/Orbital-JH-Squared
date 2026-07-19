import { describe, it, expect } from 'vitest';
import { weeksToBitmask, bitmaskToWeeks, formatWeeksDisplay } from '@/utils/timetableUtils/weekFormat';

describe('Week Format Utilities', () => {
    it('converts array to bitmask', () => {
        expect(weeksToBitmask([1, 3])).toBe(5); // 1 | 4
    });

    it('converts bitmask to array', () => {
        expect(bitmaskToWeeks(5)).toEqual([1, 3]);
    });

    it('formats display strings correctly', () => {
        expect(formatWeeksDisplay([1, 2, 3])).toBe('Weeks 1-3');
        expect(formatWeeksDisplay([1, 3])).toBe('Week 1, Week 3');
    });
});