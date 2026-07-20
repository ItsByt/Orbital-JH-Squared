import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useTimetableExport } from "@/hooks/TimetableHooks/useTimetableExport"; 
import * as htmlToImage from "html-to-image";

vi.mock("html-to-image", () => ({
    toPng: vi.fn(),
}));

const mockedToPng = vi.mocked(htmlToImage.toPng);

describe("useTimetableExport", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        vi.stubGlobal(
            "requestAnimationFrame",
            (callback: FrameRequestCallback) => {
                callback(0);
                return 0;
            }
        );
    });

    it("initialises with captureMode false", () => {
        const { result } = renderHook(() => useTimetableExport(1));

        expect(result.current.captureMode).toBe(false);
        expect(result.current.timetableRef.current).toBeNull();
    });

    it("does nothing when timetable ref is null", async () => {
        const { result } = renderHook(() => useTimetableExport(1));

        await act(async () => {
            await result.current.downloadTimetable();
        });

        expect(mockedToPng).not.toHaveBeenCalled();
        expect(result.current.captureMode).toBe(false);
    });

    it("exports timetable successfully", async () => {
        mockedToPng.mockResolvedValue("data:image/png;base64,test");

        const { result } = renderHook(() => useTimetableExport(2));

        const element = document.createElement("div");

        Object.defineProperty(element, "scrollWidth", {
            value: 800,
        });

        Object.defineProperty(element, "scrollHeight", {
            value: 1200,
        });

        result.current.timetableRef.current = element;

        const clickSpy = vi
            .spyOn(HTMLAnchorElement.prototype, "click")
            .mockImplementation(() => {});

        await act(async () => {
            await result.current.downloadTimetable();
        });

        expect(mockedToPng).toHaveBeenCalledWith(
            element,
            {
                backgroundColor: "#121212",
                pixelRatio: 2,
                width: 800,
                height: 1200,
                cacheBust: true,
            }
        );

        expect(clickSpy).toHaveBeenCalledTimes(1);
        expect(result.current.captureMode).toBe(false);

        clickSpy.mockRestore();
    });

    it("sets correct filename during download", async () => {
        mockedToPng.mockResolvedValue("test-url");

        const { result } = renderHook(() => useTimetableExport(3));

        const element = document.createElement("div");

        Object.defineProperty(element, "scrollWidth", {
            value: 500,
        });

        Object.defineProperty(element, "scrollHeight", {
            value: 700,
        });

        result.current.timetableRef.current = element;

        const anchor = document.createElement("a");

        const createElementSpy = vi
            .spyOn(document, "createElement")
            .mockReturnValueOnce(anchor);

        const clickSpy = vi
            .spyOn(anchor, "click")
            .mockImplementation(() => {});

        await act(async () => {
            await result.current.downloadTimetable();
        });

        expect(anchor.download).toBe("semester-3.png");
        expect(anchor.href).toContain("test-url");

        expect(clickSpy).toHaveBeenCalledTimes(1);

        createElementSpy.mockRestore();
        clickSpy.mockRestore();
    });

    it("restores styles after successful export", async () => {
        mockedToPng.mockResolvedValue("url");

        const { result } = renderHook(() => useTimetableExport(1));

        const element = document.createElement("div");

        element.style.width = "300px";
        element.style.height = "400px";
        element.style.overflow = "hidden";

        Object.defineProperty(element, "scrollWidth", {
            value: 900,
        });

        Object.defineProperty(element, "scrollHeight", {
            value: 1000,
        });

        result.current.timetableRef.current = element;

        vi.spyOn(HTMLAnchorElement.prototype, "click")
            .mockImplementation(() => {});

        await act(async () => {
            await result.current.downloadTimetable();
        });

        expect(element.style.width).toBe("300px");
        expect(element.style.height).toBe("400px");
        expect(element.style.overflow).toBe("hidden");
    });

    it("handles export failure and restores state", async () => {
        mockedToPng.mockRejectedValue(
            new Error("PNG conversion failed")
        );

        const consoleSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        const { result } = renderHook(() => useTimetableExport(1));

        const element = document.createElement("div");

        element.style.width = "300px";
        element.style.height = "400px";
        element.style.overflow = "hidden";

        Object.defineProperty(element, "scrollWidth", {
            value: 800,
        });

        Object.defineProperty(element, "scrollHeight", {
            value: 900,
        });

        result.current.timetableRef.current = element;

        await act(async () => {
            await result.current.downloadTimetable();
        });

        await waitFor(() => {
            expect(result.current.captureMode).toBe(false);
        });

        expect(consoleSpy).toHaveBeenCalledWith(
            "Failed to export timetable:",
            expect.any(Error)
        );

        expect(element.style.width).toBe("300px");
        expect(element.style.height).toBe("400px");
        expect(element.style.overflow).toBe("hidden");

        consoleSpy.mockRestore();
    });
});