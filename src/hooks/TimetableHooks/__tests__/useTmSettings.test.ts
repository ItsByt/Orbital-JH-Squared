import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useTimetableSettings } from "@/hooks/TimetableHooks/useTimetableSettings";
import { useSettingsStore } from "@/store/useSettingsStore";
import { supabase } from "@/services/supabase";

vi.mock("@/store/useSettingsStore", () => ({
    useSettingsStore: vi.fn(),
}));

vi.mock("@/services/supabase", () => ({
    supabase: {
        auth: {
            getUser: vi.fn(),
        },
        from: vi.fn(),
    },
}));

const mockedUseSettingsStore = vi.mocked(useSettingsStore);

const mockedGetUser = vi.mocked(supabase.auth.getUser);

const mockedFrom = vi.mocked(supabase.from);

describe("useTimetableSettings", () => {
    const hydrateSettings = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        mockedUseSettingsStore.mockReturnValue({
            startHour: 8,
            endHour: 22,
            hydrateSettings,
        } as ReturnType<typeof useSettingsStore>);

        mockedGetUser.mockResolvedValue({
            data: {
                user: null,
            },
        } as Awaited<ReturnType<typeof supabase.auth.getUser>>);
    });

    it("returns default dynamic hours correctly", () => {
        const { result } = renderHook(() => useTimetableSettings());

        expect(result.current.dynamicHours).toEqual([
            "0800",
            "0900",
            "1000",
            "1100",
            "1200",
            "1300",
            "1400",
            "1500",
            "1600",
            "1700",
            "1800",
            "1900",
            "2000",
            "2100",
        ]);
    });

    it("creates dynamic hours based on custom time range", () => {
        mockedUseSettingsStore.mockReturnValue({
            startHour: 10,
            endHour: 14,
            hydrateSettings,
        } as ReturnType<typeof useSettingsStore>);

        const { result } = renderHook(() => useTimetableSettings());

        expect(result.current.dynamicHours).toEqual(["1000", "1100", "1200", "1300"]);
    });

    it("loads and hydrates user settings", async () => {
        mockedGetUser.mockResolvedValue({
            data: {
                user: {
                    id: "user-1",
                },
            },
        } as Awaited<ReturnType<typeof supabase.auth.getUser>>);

        const selectMock = vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
                data: [
                    {
                        start_hour: 9,
                        end_hour: 18,
                        card_font_size: "large",
                        card_font_family: "inter",
                    },
                ],
                error: null,
            }),
        });

        mockedFrom.mockReturnValue({
            select: selectMock,
        } as unknown as ReturnType<typeof supabase.from>);

        renderHook(() => useTimetableSettings());

        await waitFor(() => {
            expect(hydrateSettings).toHaveBeenCalledWith({
                startHour: 9,
                endHour: 18,
                cardFontSize: "large",
                cardFontFamily: "inter",
            });
        });

        expect(mockedFrom).toHaveBeenCalledWith("accessibilities");

        expect(selectMock).toHaveBeenCalledWith(
            "start_hour, end_hour, card_font_size, card_font_family"
        );
    });

    it("does not hydrate when no user exists", async () => {
        mockedGetUser.mockResolvedValue({
            data: {
                user: null,
            },
        } as Awaited<ReturnType<typeof supabase.auth.getUser>>);

        renderHook(() => useTimetableSettings());

        await waitFor(() => {
            expect(mockedGetUser).toHaveBeenCalled();
        });

        expect(hydrateSettings).not.toHaveBeenCalled();
        expect(mockedFrom).not.toHaveBeenCalled();
    });

    it("handles supabase errors without hydrating", async () => {
        mockedGetUser.mockResolvedValue({
            data: {
                user: {
                    id: "user-1",
                },
            },
        } as Awaited<ReturnType<typeof supabase.auth.getUser>>);

        mockedFrom.mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                    data: null,
                    error: new Error("Database error"),
                }),
            }),
        } as unknown as ReturnType<typeof supabase.from>);

        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        renderHook(() => useTimetableSettings());

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith("Fetch error:", expect.any(Error));
        });

        expect(hydrateSettings).not.toHaveBeenCalled();

        consoleSpy.mockRestore();
    });

    it("does not call hydration twice on rerenders", async () => {
        mockedGetUser.mockResolvedValue({
            data: {
                user: {
                    id: "user-1",
                },
            },
        } as Awaited<ReturnType<typeof supabase.auth.getUser>>);

        mockedFrom.mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                    data: [
                        {
                            start_hour: 8,
                            end_hour: 20,
                            card_font_size: "regular",
                            card_font_family: "sans",
                        },
                    ],
                    error: null,
                }),
            }),
        } as unknown as ReturnType<typeof supabase.from>);

        const { rerender } = renderHook(() => useTimetableSettings());

        await waitFor(() => {
            expect(hydrateSettings).toHaveBeenCalledTimes(1);
        });

        rerender();

        expect(hydrateSettings).toHaveBeenCalledTimes(1);
    });
});
