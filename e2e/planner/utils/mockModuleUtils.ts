import { Locator, Page, expect } from "@playwright/test";

export async function addCourseSafely(page: Page, locationKey: string, moduleCode: string) {
    if (locationKey === "exemption") {
        await page.locator('[data-testid="add-exemption-btn"]').click();
    } else {
        await page.locator(`[data-testid="add-course-btn-${locationKey}"]`).click();
    }

    await page.getByPlaceholder("Search module code or title...").fill(moduleCode);

    // Using Promise.all to perfectly sync the click and network listener
    const [insertResponse] = await Promise.all([
        page.waitForResponse(
            (response) =>
                response.url().includes("planner_modules") && response.request().method() === "POST"
        ),
        page.locator(`[data-testid="api-search-result-${moduleCode}"]`).click(),
    ]);

    // Ensure it was successful (Status 200-299)
    expect(insertResponse.ok()).toBeTruthy();

    await page.keyboard.press("Escape");
    await expect(page.locator('[data-testid="add-course-modal"]')).toBeHidden();

    // Wait for the UI to fully mount the new card before moving on
    await expect(page.locator(`[data-testid="module-card-${moduleCode}"]`)).toBeVisible();
}

export async function updateGradeSafely(page: Page, moduleCode: string, grade: string) {
    const gradeTrigger = page.locator(`[data-testid="grade-selector-trigger-${moduleCode}"]`);
    await expect(gradeTrigger).toBeEnabled();

    // Click to open the dropdown
    await gradeTrigger.click();

    // Need to wait 200ms for the Radix UI fade-in animation to finish
    // If we click while it's transitioning, Radix swallows the React state update
    await page.waitForTimeout(200);

    const option = page.getByRole("menuitem", { name: grade, exact: true });
    await expect(option).toBeVisible();

    const [patchResponse] = await Promise.all([
        page.waitForResponse(
            (response) =>
                response.url().includes("planner_modules") &&
                response.request().method() === "PATCH"
        ),
        option.click(),
    ]);

    // Ensure Database success
    expect(patchResponse.ok()).toBeTruthy();

    // Verify UI
    await expect(gradeTrigger).toContainText(grade);
}

export async function retryDragAndDrop(page: Page, source: Locator, target: Locator) {
    await expect(async () => {
        const patchPromise = page.waitForResponse((res) => res.url().includes("planner_modules"), {
            timeout: 3000,
        });

        const sourceBox = await source.boundingBox();
        const targetBox = await target.boundingBox();
        if (!sourceBox || !targetBox) throw new Error("Bounding box not found!");

        // Pick up the card from its center
        await page.mouse.move(
            sourceBox.x + sourceBox.width / 2,
            sourceBox.y + sourceBox.height / 2
        );
        await page.mouse.down();
        await page.waitForTimeout(200);

        // Move to the TARGET
        // We aim for the Bottom of the target box (targetBox.y + targetBox.height - 20)
        // So as to avoid the "Semester" text header and land in the dropzone
        const dropX = targetBox.x + targetBox.width / 2;
        const dropY = targetBox.y + targetBox.height - 20;

        await page.mouse.move(dropX, dropY, { steps: 10 });
        await page.waitForTimeout(200);

        // We jiggle the mouse slightly to ensure Hello-Pangea-Dnd registers the hover
        await page.mouse.move(dropX + 2, dropY + 2);
        await page.waitForTimeout(200);

        // Release
        await page.mouse.up();

        const res = await patchPromise;
        expect(res.ok()).toBeTruthy();
    }).toPass({
        timeout: 15000,
        intervals: [1000],
    });
}
