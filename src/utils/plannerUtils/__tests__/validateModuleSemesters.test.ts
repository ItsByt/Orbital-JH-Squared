import { describe, it, expect } from "vitest";
import {
    checkValidSemesterUsingModuleDetails,
    checkValidSemesterUsingPlannerModule,
} from "../validateModuleSemester";
import { ModuleDetails, PlannerModule } from "@/types";

describe("validateModuleSemesters Utilities", () => {
    describe("checkValidSemesterUsingModuleDetails", () => {
        it("should correctly check if a module is placed in a valid semester using API information", () => {
            const apiModuleDetails1: ModuleDetails = {
                moduleCode: "MA2101",
                title: "Linear Algebra II",
                moduleCredit: "4",
                semesterData: [
                    { semester: 1, timetable: [] },
                    { semester: 2, timetable: [] },
                ],
            };

            const apiModuleDetails2: ModuleDetails = {
                moduleCode: "CS3231",
                title: "Theory of Computation",
                moduleCredit: "4",
                semesterData: [{ semester: 1, timetable: [] }],
            };

            const apiModuleDetails3: ModuleDetails = {
                moduleCode: "MA2108S",
                title: "Mathematical Analysis I (S)",
                moduleCredit: "5",
                semesterData: [{ semester: 2, timetable: [] }],
            };

            const apiModuleDetails4: ModuleDetails = {
                moduleCode: "CS1010E",
                title: "Programming Methodology",
                moduleCredit: "4",
                semesterData: [
                    { semester: 1, timetable: [] },
                    { semester: 2, timetable: [] },
                    { semester: 4, timetable: [] },
                ],
            };

            expect(checkValidSemesterUsingModuleDetails(apiModuleDetails1, 1)).toBe(true);
            expect(checkValidSemesterUsingModuleDetails(apiModuleDetails1, 2)).toBe(true);

            expect(checkValidSemesterUsingModuleDetails(apiModuleDetails2, 1)).toBe(true);
            expect(checkValidSemesterUsingModuleDetails(apiModuleDetails2, 2)).toBe(false); // Module 2 is only available in semester 1

            expect(checkValidSemesterUsingModuleDetails(apiModuleDetails3, 1)).toBe(false); // Module 3 is only available in semester 2
            expect(checkValidSemesterUsingModuleDetails(apiModuleDetails3, 2)).toBe(true);

            expect(checkValidSemesterUsingModuleDetails(apiModuleDetails4, 0)).toBe(true); // unvalidated semester
            expect(checkValidSemesterUsingModuleDetails(apiModuleDetails4, 1)).toBe(true);
            expect(checkValidSemesterUsingModuleDetails(apiModuleDetails4, 2)).toBe(true);
            expect(checkValidSemesterUsingModuleDetails(apiModuleDetails4, 3)).toBe(false);
            expect(checkValidSemesterUsingModuleDetails(apiModuleDetails4, 4)).toBe(true);
            expect(checkValidSemesterUsingModuleDetails(apiModuleDetails4, 5)).toBe(true); // unvalidated semester
            expect(checkValidSemesterUsingModuleDetails(apiModuleDetails4, 6)).toBe(true); // unvalidated semester
        });

        it("should correctly check if a module is placed in a valid semester using Planner Module information", () => {
            const mockModule1: PlannerModule = {
                moduleCode: "PL1101E",
                title: "Introduction to Psychology",
                moduleCredit: 4,
                displayOrder: 1,
                availableSemesters: [1, 2],
                isExemption: true,
                excludeFromTotal: true,
                hidePreReqWarning: false,
                isCustom: false,
                grade: "B-",
            };

            const mockModule2: PlannerModule = {
                moduleCode: "MA1100T",
                title: "Discrete Structures (T)",
                moduleCredit: 4,
                displayOrder: 0,
                availableSemesters: [1],
                isExemption: false,
                excludeFromTotal: false,
                hidePreReqWarning: true,
                isCustom: false,
                grade: undefined,
            };

            const mockModule3: PlannerModule = {
                moduleCode: "ST4238",
                title: "Stochastic Processes II",
                moduleCredit: 4,
                displayOrder: 0,
                availableSemesters: [2],
                isExemption: false,
                excludeFromTotal: false,
                hidePreReqWarning: false,
                isCustom: false,
                grade: "A+",
            };

            const mockModule4: PlannerModule = {
                moduleCode: "RVC2000",
                title: "Culture and Sustainability in Southeast Asia",
                moduleCredit: 4,
                displayOrder: 5,
                availableSemesters: [2, 3],
                isExemption: false,
                excludeFromTotal: false,
                hidePreReqWarning: false,
                isCustom: false,
                grade: undefined,
            };

            const customModule: PlannerModule = {
                moduleCode: "TEST",
                title: "DUMMY MODULE",
                moduleCredit: 2,
                displayOrder: 3,
                availableSemesters: [],
                isExemption: false,
                excludeFromTotal: false,
                hidePreReqWarning: false,
                isCustom: true,
                grade: "D+",
            };

            expect(checkValidSemesterUsingPlannerModule(mockModule1, 1)).toBe(true);
            expect(checkValidSemesterUsingPlannerModule(mockModule1, 2)).toBe(true);

            expect(checkValidSemesterUsingPlannerModule(mockModule2, 1)).toBe(true);
            expect(checkValidSemesterUsingPlannerModule(mockModule2, 2)).toBe(false); // Module 2 is only available in semester 1

            expect(checkValidSemesterUsingPlannerModule(mockModule3, 1)).toBe(false); // Module 3 is only available in semester 2
            expect(checkValidSemesterUsingPlannerModule(mockModule3, 2)).toBe(true);

            expect(checkValidSemesterUsingPlannerModule(mockModule4, 0)).toBe(true); // unvalidated semester
            expect(checkValidSemesterUsingPlannerModule(mockModule4, 1)).toBe(false);
            expect(checkValidSemesterUsingPlannerModule(mockModule4, 2)).toBe(true);
            expect(checkValidSemesterUsingPlannerModule(mockModule4, 3)).toBe(true);
            expect(checkValidSemesterUsingPlannerModule(mockModule4, 4)).toBe(false);
            expect(checkValidSemesterUsingPlannerModule(mockModule4, 5)).toBe(true); // unvalidated semester
            expect(checkValidSemesterUsingPlannerModule(mockModule4, 6)).toBe(true); // unvalidated semester

            expect(checkValidSemesterUsingPlannerModule(customModule, 1)).toBe(true);
            expect(checkValidSemesterUsingPlannerModule(customModule, 2)).toBe(true);
        });
    });
});
