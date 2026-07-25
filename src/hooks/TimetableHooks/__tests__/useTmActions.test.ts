import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTimetableActions } from "../useTimetableActions";
import { useQueryClient } from "@tanstack/react-query";
import { getModule } from "@/services/nusmods";
import {
    addToTimetableDB,
    removeFromTimetableDB,
    addCustomEventToDB,
    updateCustomEventInDB,
    updateModuleColorInDB,
} from "@/services/timetableDB";
import { getCurrentAcadYear } from "@/utils/generalUtils/time";
import { getErrorMessage } from "@/utils/generalUtils/getErrorMessage";
import { timeToMins } from "@/utils/timetableUtils/timeFormat";
import { toast } from "sonner";
import type { DisplayLesson } from "@/types";

// --- Mock Dependencies ---
vi.mock("@tanstack/react-query", () => ({
    useQueryClient: vi.fn(),
}));

vi.mock("@/services/nusmods", () => ({
    getModule: vi.fn(),
}));

vi.mock("@/services/timetableDB", () => ({
    addToTimetableDB: vi.fn(),
    removeFromTimetableDB: vi.fn(),
    addCustomEventToDB: vi.fn(),
    updateCustomEventInDB: vi.fn(),
    updateModuleColorInDB: vi.fn(),
}));

vi.mock("@/utils/generalUtils/time", () => ({
    getCurrentAcadYear: vi.fn(),
}));

vi.mock("@/utils/generalUtils/getErrorMessage", () => ({
    getErrorMessage: vi.fn(),
}));

vi.mock("@/utils/timetableUtils/timeFormat", () => ({
    timeToMins: vi.fn(),
}));

vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// --- Test Helpers ---
const createMockLesson = (overrides?: Partial<DisplayLesson>): DisplayLesson =>
    ({
        id: "lesson-1" as unknown as DisplayLesson["id"],
        moduleCode: "CS1010S",
        lessonType: "Lecture",
        classNo: "1" as unknown as DisplayLesson["classNo"],
        day: "Monday",
        startTime: "10:00",
        endTime: "12:00",
        venue: "LT1",
        weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
        weekBitmask: 8191,
        isAlternative: false,
        startMins: 600,
        endMins: 720,
        color: "#ff0000",
        ...overrides,
    }) as DisplayLesson;

describe("useTimetableActions", () => {
    const mockInvalidateQueries = vi.fn();
    const mockSetQueryData = vi.fn();
    const mockSelectModuleToCompare = vi.fn();
    const mockClearAlternatives = vi.fn();
    const mockSwapModuleSlot = vi.fn();

    const currentSemester = 1;
    const mockAcadYear = 2026;

    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(useQueryClient).mockReturnValue({
            invalidateQueries: mockInvalidateQueries,
            setQueryData: mockSetQueryData,
        } as unknown as ReturnType<typeof useQueryClient>);

        vi.mocked(getCurrentAcadYear).mockReturnValue(mockAcadYear);

        vi.mocked(getErrorMessage).mockImplementation((err: unknown) =>
            err instanceof Error ? err.message : "Unknown error occurred"
        );

        vi.mocked(timeToMins).mockImplementation((time: string | number) => {
            const timeStr = String(time);
            const [hours, mins] = timeStr.split(":").map(Number);
            return (hours || 0) * 60 + (mins || 0);
        });
    });

    // --- handleSelectClass ---
    describe("handleSelectClass", () => {
        it("clears alternatives when the already selected class is clicked again", () => {
            const selectedLesson = createMockLesson({
                id: "lesson-1" as unknown as DisplayLesson["id"],
            });
            const { result } = renderHook(() =>
                useTimetableActions(
                    currentSemester,
                    selectedLesson,
                    mockSelectModuleToCompare,
                    mockClearAlternatives,
                    mockSwapModuleSlot
                )
            );

            act(() => {
                result.current.handleSelectClass(
                    createMockLesson({ id: "lesson-1" as unknown as DisplayLesson["id"] })
                );
            });

            expect(mockClearAlternatives).toHaveBeenCalledTimes(1);
            expect(mockSelectModuleToCompare).not.toHaveBeenCalled();
        });

        it("selects module to compare when a new class is clicked", () => {
            const selectedLesson = createMockLesson({
                id: "lesson-1" as unknown as DisplayLesson["id"],
            });
            const { result } = renderHook(() =>
                useTimetableActions(
                    currentSemester,
                    selectedLesson,
                    mockSelectModuleToCompare,
                    mockClearAlternatives,
                    mockSwapModuleSlot
                )
            );

            const newLesson = createMockLesson({
                id: "lesson-2" as unknown as DisplayLesson["id"],
            });
            act(() => {
                result.current.handleSelectClass(newLesson);
            });

            expect(mockSelectModuleToCompare).toHaveBeenCalledWith(newLesson);
            expect(mockClearAlternatives).not.toHaveBeenCalled();
        });
    });

    // --- handleSwapClass ---
    describe("handleSwapClass", () => {
        it("returns early if oldLesson is null", async () => {
            const { result } = renderHook(() =>
                useTimetableActions(
                    currentSemester,
                    null,
                    mockSelectModuleToCompare,
                    mockClearAlternatives,
                    mockSwapModuleSlot
                )
            );

            await act(async () => {
                await result.current.handleSwapClass(null, createMockLesson());
            });

            expect(mockSwapModuleSlot).not.toHaveBeenCalled();
        });

        it("swaps class and retains the old lesson color", async () => {
            const oldLesson = createMockLesson({
                id: "old-id" as unknown as DisplayLesson["id"],
                color: "#123456",
            });
            const alternative = createMockLesson({
                id: "alt-id" as unknown as DisplayLesson["id"],
                color: "#ffffff",
            });

            const { result } = renderHook(() =>
                useTimetableActions(
                    currentSemester,
                    null,
                    mockSelectModuleToCompare,
                    mockClearAlternatives,
                    mockSwapModuleSlot
                )
            );

            await act(async () => {
                await result.current.handleSwapClass(oldLesson, alternative);
            });

            expect(mockSwapModuleSlot).toHaveBeenCalledWith(oldLesson, {
                ...alternative,
                color: "#123456",
            });
        });

        it("shows error toast when swap fails", async () => {
            mockSwapModuleSlot.mockImplementation(() => {
                throw new Error("Swap failed");
            });

            const { result } = renderHook(() =>
                useTimetableActions(
                    currentSemester,
                    null,
                    mockSelectModuleToCompare,
                    mockClearAlternatives,
                    mockSwapModuleSlot
                )
            );

            await act(async () => {
                await result.current.handleSwapClass(createMockLesson(), createMockLesson());
            });

            expect(toast.error).toHaveBeenCalledWith("Failed to swap class", {
                description: "Swap failed",
            });
        });
    });

    // --- handleAddModule ---
    describe("handleAddModule", () => {
        it("shows error toast if module is a duplicate (non-custom)", async () => {
            const activeLessons = [
                createMockLesson({
                    moduleCode: "CS1010S",
                    id: "nusmod-1" as unknown as DisplayLesson["id"],
                }),
            ];
            const { result } = renderHook(() =>
                useTimetableActions(
                    currentSemester,
                    null,
                    mockSelectModuleToCompare,
                    mockClearAlternatives,
                    mockSwapModuleSlot
                )
            );

            await act(async () => {
                await result.current.handleAddModule("CS1010S", activeLessons);
            });

            expect(toast.error).toHaveBeenCalledWith("Failed to add module", {
                description: "CS1010S is already in your timetable!",
            });
            expect(addToTimetableDB).not.toHaveBeenCalled();
        });

        it("allows adding duplicate module code if existing entry is a personal/custom block", async () => {
            const activeLessons = [
                createMockLesson({
                    moduleCode: "CS1010S",
                    id: "custom-123" as unknown as DisplayLesson["id"],
                }),
            ];
            vi.mocked(getModule).mockResolvedValue({
                moduleCode: "CS1010S",
                semesterData: [
                    {
                        semester: currentSemester,
                        timetable: [{ lessonType: "Lecture", classNo: "1" }],
                    },
                ],
            } as unknown as Awaited<ReturnType<typeof getModule>>);

            const { result } = renderHook(() =>
                useTimetableActions(
                    currentSemester,
                    null,
                    mockSelectModuleToCompare,
                    mockClearAlternatives,
                    mockSwapModuleSlot
                )
            );

            await act(async () => {
                await result.current.handleAddModule("CS1010S", activeLessons);
            });

            expect(addToTimetableDB).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith("CS1010S successfully added!");
        });

        it("shows error toast if module is not offered in the current semester", async () => {
            vi.mocked(getModule).mockResolvedValue({
                moduleCode: "CS1010S",
                semesterData: [{ semester: 2, timetable: [] }],
            } as unknown as Awaited<ReturnType<typeof getModule>>);

            const { result } = renderHook(() =>
                useTimetableActions(
                    currentSemester,
                    null,
                    mockSelectModuleToCompare,
                    mockClearAlternatives,
                    mockSwapModuleSlot
                )
            );

            await act(async () => {
                await result.current.handleAddModule("CS1010S", []);
            });

            expect(toast.error).toHaveBeenCalledWith("Failed to add module", {
                description: `Module is not offered in Semester ${currentSemester}`,
            });
        });

        it("adds module to DB, invalidates query, and toasts success", async () => {
            const mockTimetable = [
                { lessonType: "Lecture", classNo: "1" as unknown as DisplayLesson["classNo"] },
            ];
            vi.mocked(getModule).mockResolvedValue({
                moduleCode: "CS1010S",
                semesterData: [{ semester: currentSemester, timetable: mockTimetable }],
            } as unknown as Awaited<ReturnType<typeof getModule>>);

            const { result } = renderHook(() =>
                useTimetableActions(
                    currentSemester,
                    null,
                    mockSelectModuleToCompare,
                    mockClearAlternatives,
                    mockSwapModuleSlot
                )
            );

            await act(async () => {
                await result.current.handleAddModule("CS1010S", []);
            });

            expect(addToTimetableDB).toHaveBeenCalledWith(
                "CS1010S",
                mockTimetable,
                mockAcadYear,
                currentSemester
            );
            expect(mockInvalidateQueries).toHaveBeenCalledWith({
                queryKey: ["timetable", mockAcadYear, currentSemester],
            });
            expect(toast.success).toHaveBeenCalledWith("CS1010S successfully added!");
        });
    });

    // --- handleRemoveModule ---
    describe("handleRemoveModule", () => {
        it("returns early if moduleCode is empty", async () => {
            const { result } = renderHook(() =>
                useTimetableActions(
                    currentSemester,
                    null,
                    mockSelectModuleToCompare,
                    mockClearAlternatives,
                    mockSwapModuleSlot
                )
            );

            await act(async () => {
                await result.current.handleRemoveModule("");
            });

            expect(removeFromTimetableDB).not.toHaveBeenCalled();
        });

        it("removes a personal block using specific parameters", async () => {
            const { result } = renderHook(() =>
                useTimetableActions(
                    currentSemester,
                    null,
                    mockSelectModuleToCompare,
                    mockClearAlternatives,
                    mockSwapModuleSlot
                )
            );

            await act(async () => {
                await result.current.handleRemoveModule("Gym", "custom-123", "Personal Block");
            });

            expect(removeFromTimetableDB).toHaveBeenCalledWith(
                "Gym",
                mockAcadYear,
                currentSemester,
                "custom-123" as never,
                "Personal Block"
            );
            expect(mockInvalidateQueries).toHaveBeenCalledWith({
                queryKey: ["timetable", mockAcadYear, currentSemester],
            });
            expect(toast.success).toHaveBeenCalledWith("Gym removed from your timetable.");
        });

        it("removes a regular academic module", async () => {
            const { result } = renderHook(() =>
                useTimetableActions(
                    currentSemester,
                    null,
                    mockSelectModuleToCompare,
                    mockClearAlternatives,
                    mockSwapModuleSlot
                )
            );

            await act(async () => {
                await result.current.handleRemoveModule("CS1010S");
            });

            expect(removeFromTimetableDB).toHaveBeenCalledWith(
                "CS1010S",
                mockAcadYear,
                currentSemester
            );
            expect(toast.success).toHaveBeenCalledWith("CS1010S removed from your timetable.");
        });

        it("shows error toast when removal fails", async () => {
            vi.mocked(removeFromTimetableDB).mockRejectedValue(new Error("DB delete failed"));
            const { result } = renderHook(() =>
                useTimetableActions(
                    currentSemester,
                    null,
                    mockSelectModuleToCompare,
                    mockClearAlternatives,
                    mockSwapModuleSlot
                )
            );

            await act(async () => {
                await result.current.handleRemoveModule("CS1010S");
            });

            expect(toast.error).toHaveBeenCalledWith("Failed to remove module", {
                description: "DB delete failed",
            });
        });
    });

    // --- handleCustomEvent ---
    describe("handleCustomEvent", () => {
        it("creates custom event, computes minutes, saves to DB, and toasts success", async () => {
            const { result } = renderHook(() =>
                useTimetableActions(
                    currentSemester,
                    null,
                    mockSelectModuleToCompare,
                    mockClearAlternatives,
                    mockSwapModuleSlot
                )
            );

            const eventData = {
                name: "  Team Meeting  ",
                day: "Wednesday",
                startTime: "14:00",
                endTime: "16:00",
                venue: "  UTown  ",
                selectedWeeks: [1, 2, 3],
                weekBitmask: 7,
                classNo: "1",
            };

            await act(async () => {
                await result.current.handleCustomEvent(eventData);
            });

            expect(timeToMins).toHaveBeenCalledWith("14:00" as never);
            expect(timeToMins).toHaveBeenCalledWith("16:00" as never);
            expect(addCustomEventToDB).toHaveBeenCalledWith(
                expect.objectContaining({
                    moduleCode: "Team Meeting",
                    lessonType: "Personal Block",
                    venue: "UTown",
                    startMins: 840,
                    endMins: 960,
                    isAlternative: false,
                }),
                mockAcadYear,
                currentSemester
            );
            expect(mockInvalidateQueries).toHaveBeenCalledWith({
                queryKey: ["timetable", mockAcadYear, currentSemester],
            });
            expect(toast.success).toHaveBeenCalledWith('Custom event "Team Meeting" added!');
        });

        it("defaults venue to 'No Venue Assigned' if whitespace or empty", async () => {
            const { result } = renderHook(() =>
                useTimetableActions(
                    currentSemester,
                    null,
                    mockSelectModuleToCompare,
                    mockClearAlternatives,
                    mockSwapModuleSlot
                )
            );

            await act(async () => {
                await result.current.handleCustomEvent({
                    name: "Study",
                    day: "Monday",
                    startTime: "10:00",
                    endTime: "11:00",
                    venue: "   ",
                    selectedWeeks: [1],
                    weekBitmask: 1,
                    classNo: "1",
                });
            });

            expect(addCustomEventToDB).toHaveBeenCalledWith(
                expect.objectContaining({
                    venue: "No Venue Assigned",
                }),
                mockAcadYear,
                currentSemester
            );
        });

        it("shows error toast when adding custom event fails", async () => {
            vi.mocked(addCustomEventToDB).mockRejectedValue(new Error("Failed DB insert"));
            const { result } = renderHook(() =>
                useTimetableActions(
                    currentSemester,
                    null,
                    mockSelectModuleToCompare,
                    mockClearAlternatives,
                    mockSwapModuleSlot
                )
            );

            await act(async () => {
                await result.current.handleCustomEvent({
                    name: "Study",
                    day: "Monday",
                    startTime: "10:00",
                    endTime: "11:00",
                    venue: "",
                    selectedWeeks: [1],
                    weekBitmask: 1,
                    classNo: "1",
                });
            });

            expect(toast.error).toHaveBeenCalledWith("Failed to save custom event", {
                description: "Failed DB insert",
            });
        });
    });

    // --- handleUpdateCustomEvent ---
    describe("handleUpdateCustomEvent", () => {
        it("updates event in DB, invalidates queries, and toasts success", async () => {
            const { result } = renderHook(() =>
                useTimetableActions(
                    currentSemester,
                    null,
                    mockSelectModuleToCompare,
                    mockClearAlternatives,
                    mockSwapModuleSlot
                )
            );

            const updateData = {
                name: "Updated Meeting",
                day: "Friday",
                startTime: "12:00",
                endTime: "13:00",
                venue: "COM1",
                selectedWeeks: [2, 4],
                weekBitmask: 10,
                classNo: "2",
            };

            await act(async () => {
                await result.current.handleUpdateCustomEvent("custom-1", updateData);
            });

            expect(updateCustomEventInDB).toHaveBeenCalledWith(
                "custom-1" as never,
                updateData,
                mockAcadYear,
                currentSemester
            );
            expect(mockInvalidateQueries).toHaveBeenCalledWith({
                queryKey: ["timetable", mockAcadYear, currentSemester],
            });
            expect(toast.success).toHaveBeenCalledWith("Custom event updated!");
        });

        it("shows error toast when updating custom event fails", async () => {
            vi.mocked(updateCustomEventInDB).mockRejectedValue(new Error("Update failed"));
            const { result } = renderHook(() =>
                useTimetableActions(
                    currentSemester,
                    null,
                    mockSelectModuleToCompare,
                    mockClearAlternatives,
                    mockSwapModuleSlot
                )
            );

            await act(async () => {
                await result.current.handleUpdateCustomEvent("custom-1", {
                    name: "Test",
                    day: "Monday",
                    startTime: "10:00",
                    endTime: "11:00",
                    venue: "",
                    selectedWeeks: [1],
                    weekBitmask: 1,
                    classNo: "1",
                });
            });

            expect(toast.error).toHaveBeenCalledWith("Failed to update custom event", {
                description: "Update failed",
            });
        });
    });

    // --- handleUpdateColor ---
    describe("handleUpdateColor", () => {
        it("optimistically updates regular module color in query cache and saves to DB", async () => {
            const { result } = renderHook(() =>
                useTimetableActions(
                    currentSemester,
                    null,
                    mockSelectModuleToCompare,
                    mockClearAlternatives,
                    mockSwapModuleSlot
                )
            );

            await act(async () => {
                await result.current.handleUpdateColor("CS1010S", "#00ff00");
            });

            expect(mockSetQueryData).toHaveBeenCalledTimes(1);
            expect(mockSetQueryData.mock.calls[0][0]).toEqual([
                "timetable",
                mockAcadYear,
                currentSemester,
            ]);

            type UpdaterFn = (oldData: DisplayLesson[] | undefined) => DisplayLesson[] | undefined;
            const updater = mockSetQueryData.mock.calls[0][1] as UpdaterFn;

            const oldLessons = [
                createMockLesson({
                    id: "1" as unknown as DisplayLesson["id"],
                    moduleCode: "CS1010S",
                    color: "#ff0000",
                }),
                createMockLesson({
                    id: "2" as unknown as DisplayLesson["id"],
                    moduleCode: "MA1521",
                    color: "#0000ff",
                }),
            ];

            const updatedLessons = updater(oldLessons);
            expect(updatedLessons?.[0].color).toBe("#00ff00");
            expect(updatedLessons?.[1].color).toBe("#0000ff");

            expect(updateModuleColorInDB).toHaveBeenCalledWith(
                "CS1010S",
                "#00ff00",
                mockAcadYear,
                currentSemester,
                undefined,
                undefined
            );
        });

        it("optimistically updates personal block color by specific ID", async () => {
            const { result } = renderHook(() =>
                useTimetableActions(
                    currentSemester,
                    null,
                    mockSelectModuleToCompare,
                    mockClearAlternatives,
                    mockSwapModuleSlot
                )
            );

            await act(async () => {
                await result.current.handleUpdateColor(
                    "Gym",
                    "#123123",
                    "custom-99",
                    "Personal Block"
                );
            });

            type UpdaterFn = (oldData: DisplayLesson[] | undefined) => DisplayLesson[] | undefined;
            const updater = mockSetQueryData.mock.calls[0][1] as UpdaterFn;

            const oldLessons = [
                createMockLesson({
                    id: "custom-99" as unknown as DisplayLesson["id"],
                    moduleCode: "Gym",
                    lessonType: "Personal Block",
                    color: "#000000",
                }),
                createMockLesson({
                    id: "custom-100" as unknown as DisplayLesson["id"],
                    moduleCode: "Gym",
                    lessonType: "Personal Block",
                    color: "#000000",
                }),
            ];

            const updatedLessons = updater(oldLessons);
            expect(updatedLessons?.[0].color).toBe("#123123");
            expect(updatedLessons?.[1].color).toBe("#000000");
        });

        it("reverts cache by invalidating queries and toasts error if DB save fails", async () => {
            vi.mocked(updateModuleColorInDB).mockRejectedValue(new Error("Color save failed"));
            const { result } = renderHook(() =>
                useTimetableActions(
                    currentSemester,
                    null,
                    mockSelectModuleToCompare,
                    mockClearAlternatives,
                    mockSwapModuleSlot
                )
            );

            await act(async () => {
                await result.current.handleUpdateColor("CS1010S", "#00ff00");
            });

            expect(toast.error).toHaveBeenCalledWith("Failed to save color", {
                description: "Color save failed",
            });
            expect(mockInvalidateQueries).toHaveBeenCalledWith({
                queryKey: ["timetable", mockAcadYear, currentSemester],
            });
        });
    });
});
