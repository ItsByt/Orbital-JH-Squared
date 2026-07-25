import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useTimetableData } from "../useTimetableData";
import type { DisplayLesson, ModuleDetails, SavedTimetableModule } from "@/types";
import { getUserId } from "@/services/auth";
import { getUserModules, swapLessonInTimetableDB } from "@/services/timetableDB";
import { getModule } from "@/services/nusmods";

vi.mock("@/services/auth", () => ({
    getUserId: vi.fn(),
}));

vi.mock("@/services/timetableDB", () => ({
    getUserModules: vi.fn(),
    swapLessonInTimetableDB: vi.fn(),
}));

vi.mock("@/services/nusmods", () => ({
    getModule: vi.fn(),
}));

const mockedGetUserId = vi.mocked(getUserId);
const mockedGetUserModules = vi.mocked(getUserModules);
const mockedSwapLesson = vi.mocked(swapLessonInTimetableDB);
const mockedGetModule = vi.mocked(getModule);

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
            mutations: {
                retry: false,
            },
        },
    });

    return function Wrapper({ children }: { children: ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
};

const savedModule: SavedTimetableModule = {
    id: "1",
    user_id: "user-1",
    module_code: "CS1010",
    lesson_type: "LEC",
    class_no: "1",
    year: 2026,
    semester: 1,
    day: "Monday",
    start_time: "1000",
    end_time: "1200",
    venue: "LT1",
    weeks: JSON.stringify([1, 2, 3]),
    color: "blue",
};

const selectedLesson: DisplayLesson = {
    id: "1",
    moduleCode: "CS1010",
    lessonType: "LEC",
    classNo: "1",
    day: "Monday",
    startTime: "1000",
    endTime: "1200",
    venue: "LT1",
    weeks: [1, 2, 3],
    startMins: 600,
    endMins: 720,
    weekBitmask: 7,
    color: "blue",
};

const alternativeRawLesson = {
    classNo: "2",
    lessonType: "LEC",
    startTime: "1200",
    endTime: "1400",
    day: "Tuesday",
    venue: "LT2",
    weeks: [1, 2, 3],
};

const moduleDetails: ModuleDetails = {
    moduleCode: "CS1010",
    title: "Programming Methodology",
    moduleCredit: "4",
    semesterData: [
        {
            semester: 1,
            timetable: [alternativeRawLesson],
        },
    ],
};

describe("useTimetableData", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("loads timetable modules successfully", async () => {
        mockedGetUserId.mockResolvedValue("user-1");

        mockedGetUserModules.mockResolvedValue({
            myModules: [savedModule],
            error: null,
        });

        const { result } = renderHook(() => useTimetableData(2026, 1), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.modules).toHaveLength(1);
        expect(result.current.modules[0].moduleCode).toBe("CS1010");
    });

    it("returns empty modules when user is not logged in", async () => {
        mockedGetUserId.mockResolvedValue(null);

        const { result } = renderHook(() => useTimetableData(2026, 1), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.modules).toEqual([]);
        expect(mockedGetUserModules).not.toHaveBeenCalled();
    });

    it("loads alternative lessons after selecting a lesson", async () => {
        mockedGetUserId.mockResolvedValue("user-1");

        mockedGetUserModules.mockResolvedValue({
            myModules: [savedModule],
            error: null,
        });

        mockedGetModule.mockResolvedValue(moduleDetails);

        const { result } = renderHook(() => useTimetableData(2026, 1), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.modules).toHaveLength(1);
        });

        act(() => {
            result.current.selectModuleToCompare(selectedLesson);
        });

        await waitFor(() => {
            expect(result.current.alternatives).toHaveLength(1);
        });

        expect(result.current.alternatives[0].classNo).toBe("2");
        expect(result.current.alternatives[0].color).toBe("blue");
    });

    it("clears alternatives when clearAlternatives is called", async () => {
        mockedGetUserId.mockResolvedValue("user-1");

        mockedGetUserModules.mockResolvedValue({
            myModules: [],
            error: null,
        });

        mockedGetModule.mockResolvedValue(moduleDetails);

        const { result } = renderHook(() => useTimetableData(2026, 1), {
            wrapper: createWrapper(),
        });

        act(() => {
            result.current.selectModuleToCompare(selectedLesson);
        });

        await waitFor(() => {
            expect(result.current.selectedLesson).not.toBeNull();
        });

        act(() => {
            result.current.clearAlternatives();
        });

        expect(result.current.selectedLesson).toBeNull();
    });

    it("optimistically updates timetable when swapping lessons", async () => {
        mockedGetUserId.mockResolvedValue("user-1");

        mockedGetUserModules.mockResolvedValue({
            myModules: [savedModule],
            error: null,
        });

        mockedGetModule.mockResolvedValue(moduleDetails);

        mockedSwapLesson.mockResolvedValue(undefined);

        const { result } = renderHook(() => useTimetableData(2026, 1), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.modules).toHaveLength(1);
        });

        act(() => {
            result.current.selectModuleToCompare(selectedLesson);
        });

        await waitFor(() => {
            expect(result.current.selectedLesson).not.toBeNull();
        });

        // Wait for NUSMods query to complete
        await waitFor(() => {
            expect(mockedGetModule).toHaveBeenCalledWith("CS1010");
        });

        await act(async () => {
            await result.current.swapModuleSlot(selectedLesson, {
                ...selectedLesson,
                classNo: "2",
            });
        });

        await waitFor(() => {
            expect(mockedSwapLesson).toHaveBeenCalledTimes(1);
        });
    });

    it("rolls back timetable when swap fails", async () => {
        mockedGetUserId.mockResolvedValue("user-1");

        mockedGetUserModules.mockResolvedValue({
            myModules: [savedModule],
            error: null,
        });

        mockedGetModule.mockResolvedValue(moduleDetails);

        mockedSwapLesson.mockRejectedValue(new Error("Database failed"));

        const { result } = renderHook(() => useTimetableData(2026, 1), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.modules).toHaveLength(1);
        });

        await act(async () => {
            await result.current.swapModuleSlot(selectedLesson, {
                ...selectedLesson,
                classNo: "2",
            });
        });

        await waitFor(() => {
            expect(result.current.modules[0].classNo).toBe("1");
        });
    });
});
