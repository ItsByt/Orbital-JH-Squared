import { test, expect } from "./fixtures";
import { Page } from "@playwright/test";
import { wipeTestDatabase } from "./utils/dbTeardown";
import { addCourseSafely, updateGradeSafely } from "./utils/mockModuleUtils";
import {
    SEMESTER_CODES,
    REVERSE_SEMESTER_CODE_MAP,
} from "../../src/utils/plannerUtils/semesterKeyUtils";

const Y1_S1 = `Y1${REVERSE_SEMESTER_CODE_MAP[SEMESTER_CODES.SEM_1]}`;
const Y2_S1 = `Y2${REVERSE_SEMESTER_CODE_MAP[SEMESTER_CODES.SEM_1]}`;

const mockNusModsApi = async (page: Page) => {
    await page.route("https://api.nusmods.com/v2/**/*.json", async (route) => {
        const url = route.request().url();
        if (url.includes("CS1101S.json")) {
            await route.fulfill({
                json: {
                    moduleCode: "CS1101S",
                    title: "Programming Methodology",
                    moduleCredit: "4",
                    prereqTree: null,
                    semesterData: [{ semester: 1 }],
                },
            });
        } else if (url.includes("MA1521.json")) {
            await route.fulfill({
                json: {
                    moduleCode: "MA1521",
                    title: "Calculus",
                    moduleCredit: "4",
                    prereqTree: null,
                    semesterData: [{ semester: 1 }, { semester: 2 }],
                },
            });
        } else if (url.includes("CS2030S.json")) {
            await route.fulfill({
                json: {
                    moduleCode: "CS2030S",
                    title: "Programming Methodology II",
                    moduleCredit: "4",
                    prereqTree: null,
                    semesterData: [{ semester: 1 }],
                },
            });
        } else {
            await route.fulfill({
                json: [
                    { moduleCode: "CS1101S", title: "Programming Methodology", semesters: [1, 2] },
                    { moduleCode: "MA1521", title: "Calculus", semesters: [1, 2] },
                    {
                        moduleCode: "CS2030S",
                        title: "Programming Methodology II",
                        semesters: [1, 2],
                    },
                ],
            });
        }
    });
};

test.describe("Planner GPA and Statistics", () => {
    test.beforeEach(async ({ page }, testInfo) => {
        await wipeTestDatabase(testInfo.parallelIndex);
        await mockNusModsApi(page);
        await page.goto("/planner");
        await expect(page.locator('[data-testid="planner-loading-screen"]')).toBeHidden();
    });

    test("Calculates total Units correctly when adding multiple modules", async ({ page }) => {
        const column = page.locator(`[data-testid="semester-column-${Y1_S1}"]`);

        await addCourseSafely(page, Y1_S1, "CS1101S");
        await expect(column).toContainText("1 Courses / 4 Units");

        await addCourseSafely(page, Y1_S1, "MA1521");
        await expect(column).toContainText("2 Courses / 8 Units");
    });

    test("Calculates progressive GPA when grades are selected", async ({ page }) => {
        const column = page.locator(`[data-testid="semester-column-${Y1_S1}"]`);

        await addCourseSafely(page, Y1_S1, "CS1101S");
        await updateGradeSafely(page, "CS1101S", "A+");

        await expect(column).toContainText("GPA: 5.00");
    });

    test("Tracks S/U usage correctly and ignores it from GPA", async ({ page }) => {
        const column = page.locator(`[data-testid="semester-column-${Y1_S1}"]`);

        await addCourseSafely(page, Y1_S1, "CS1101S");
        await updateGradeSafely(page, "CS1101S", "S");

        await expect(column).toContainText("1 S/U");
        await expect(column).not.toContainText("GPA:");
    });

    test("Calculates Semester GPA vs Cumulative GPA across multiple semesters and years", async ({
        page,
    }) => {
        const Y1_S2 = `Y1${REVERSE_SEMESTER_CODE_MAP[SEMESTER_CODES.SEM_2]}`;

        // YEAR 1 SEMESTER 1
        const y1s1Column = page.locator(`[data-testid="semester-column-${Y1_S1}"]`);
        await addCourseSafely(page, Y1_S1, "CS1101S");
        await updateGradeSafely(page, "CS1101S", "A+");

        // YEAR 1 SEMESTER 2
        const y1s2Column = page.locator(`[data-testid="semester-column-${Y1_S2}"]`);
        await addCourseSafely(page, Y1_S2, "MA1521");
        await updateGradeSafely(page, "MA1521", "A-");

        // YEAR 2 SEMESTER 1
        const y2s1Column = page.locator(`[data-testid="semester-column-${Y2_S1}"]`);
        await addCourseSafely(page, Y2_S1, "CS2030S");
        await updateGradeSafely(page, "CS2030S", "B+");

        // ASSERTIONS
        await expect(y1s1Column).toContainText("GPA: 5.00");
        await expect(y1s2Column).toContainText("GPA: 4.50");
        await expect(y2s1Column).toContainText("GPA: 4.00");

        const year1Gpa = page.locator('[data-testid="year-gpa-1"]');
        await expect(year1Gpa).toContainText("Cumulative GPA: 4.75");

        const year2Gpa = page.locator('[data-testid="year-gpa-2"]');
        await expect(year2Gpa).toContainText("Cumulative GPA: 4.50");
    });
});
