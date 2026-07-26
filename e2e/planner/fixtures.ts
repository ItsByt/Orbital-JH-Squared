import { test as base, expect } from "@playwright/test";

export const test = base.extend({
    // Automatically inject the correct authentication state based on the worker index
    // We strictly need {} as the first input since Playwright uses a custom AST (Abstract Syntax Tree)
    // parser for its fixtures, even if it is completely empty

    // eslint-disable-next-line no-empty-pattern
    storageState: async ({}, use, testInfo) => {
        await use(`playwright/.auth/user-${testInfo.parallelIndex}.json`);
    },
});

export { expect }; // So as to not import expect seperately
