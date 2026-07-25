import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CustomSlotDialog from "../CustomSlotDialog";
import { toast } from "sonner";
import { getModule } from "@/services/nusmods";
import type { DisplayLesson } from "@/types";

vi.mock("@/services/nusmods", () => ({
    getModule: vi.fn(),
}));

vi.mock("sonner", () => ({
    toast: {
        error: vi.fn(),
    },
}));

const DAYS = ["Monday", "Tuesday", "Wednesday"];
const HOURS = ["0900", "1000", "1100", "1200"];
const WEEKS = [1, 2, 3];

describe("CustomSlotDialog", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(getModule).mockResolvedValue(null);
    });

    function renderDialog(onCustomEvent = vi.fn().mockResolvedValue(undefined), props = {}) {
        return {
            onCustomEvent,
            ...render(
                <CustomSlotDialog
                    DAYS={DAYS}
                    HOURS={HOURS}
                    WEEKS={WEEKS}
                    onCustomEvent={onCustomEvent}
                    {...props}
                />
            ),
        };
    }

    it("opens dialog when trigger button is clicked", () => {
        renderDialog();

        fireEvent.click(screen.getByRole("button"));

        expect(screen.getByText("Customizable Block Creator")).toBeInTheDocument();
    });

    it("creates a custom event with valid input", async () => {
        const onCustomEvent = vi.fn().mockResolvedValue(undefined);

        renderDialog(onCustomEvent);

        fireEvent.click(screen.getByRole("button"));

        fireEvent.change(screen.getByLabelText("Activity Name"), {
            target: {
                value: "Gym",
            },
        });

        fireEvent.click(
            screen.getByRole("button", {
                name: "Insert into Schedule",
            })
        );

        await waitFor(() => {
            expect(onCustomEvent).toHaveBeenCalledTimes(1);
        });

        expect(onCustomEvent).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "Gym",
                day: "Monday",
                startTime: "0900",
                endTime: "1100",
                selectedWeeks: [1, 2, 3],
                classNo: "CUSTOM",
            })
        );
    });

    it("rejects empty activity name", async () => {
        const onCustomEvent = vi.fn();

        renderDialog(onCustomEvent);

        fireEvent.click(screen.getByRole("button"));

        fireEvent.click(
            screen.getByRole("button", {
                name: "Insert into Schedule",
            })
        );

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Missing Input", expect.anything());
        });

        expect(onCustomEvent).not.toHaveBeenCalled();
    });

    it("rejects invalid time range", async () => {
        renderDialog();

        fireEvent.click(screen.getByRole("button"));

        fireEvent.change(screen.getByLabelText("Activity Name"), {
            target: {
                value: "Gym",
            },
        });

        fireEvent.click(
            screen.getByRole("combobox", {
                name: "End Time",
            })
        );

        // Pick an end time before start time
        fireEvent.click(
            screen.getByRole("option", {
                name: "0900",
            })
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: "Insert into Schedule",
            })
        );

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Invalid Time", expect.anything());
        });
    });

    it("rejects weeks when none are selected", async () => {
        renderDialog();

        fireEvent.click(screen.getByRole("button"));

        fireEvent.change(screen.getByLabelText("Activity Name"), {
            target: {
                value: "Gym",
            },
        });

        for (const week of WEEKS) {
            fireEvent.click(screen.getByLabelText(`W${week}`));
        }

        fireEvent.click(
            screen.getByRole("button", {
                name: "Insert into Schedule",
            })
        );

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Invalid Selection", expect.anything());
        });
    });

    it("rejects names that match official modules", async () => {
        vi.mocked(getModule).mockResolvedValue({
            moduleCode: "CS1010",
            title: "Programming",
            moduleCredit: "4",
            semesterData: [],
        });

        renderDialog();

        fireEvent.click(screen.getByRole("button"));

        fireEvent.change(screen.getByLabelText("Activity Name"), {
            target: {
                value: "CS1010",
            },
        });

        fireEvent.click(
            screen.getByRole("button", {
                name: "Insert into Schedule",
            })
        );

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Naming Conflict", expect.anything());
        });
    });

    it("allows creation if NUSMods lookup fails", async () => {
        vi.mocked(getModule).mockRejectedValue(new Error("Network error"));

        const onCustomEvent = vi.fn().mockResolvedValue(undefined);

        renderDialog(onCustomEvent);

        fireEvent.click(screen.getByRole("button"));

        fireEvent.change(screen.getByLabelText("Activity Name"), {
            target: {
                value: "Swimming",
            },
        });

        fireEvent.click(
            screen.getByRole("button", {
                name: "Insert into Schedule",
            })
        );

        await waitFor(() => {
            expect(onCustomEvent).toHaveBeenCalled();
        });
    });

    it("loads existing custom lesson in edit mode", () => {
        const editLesson: DisplayLesson = {
            id: "abc",
            moduleCode: "CCA",
            lessonType: "Personal Block",
            classNo: "CUSTOM",
            day: "Tuesday",
            startTime: "1000",
            endTime: "1200",
            venue: "Hall",
            weeks: [1, 2],
            startMins: 600,
            endMins: 720,
            weekBitmask: 3,
        };

        renderDialog(vi.fn(), {
            open: true,
            editLesson,
        });

        expect(screen.getByDisplayValue("CCA")).toBeInTheDocument();

        expect(screen.getByText("Edit Custom Block")).toBeInTheDocument();
    });

    it("calls update callback in edit mode", async () => {
        const onUpdateCustomEvent = vi.fn().mockResolvedValue(undefined);

        const editLesson: DisplayLesson = {
            id: "abc",
            moduleCode: "CCA",
            lessonType: "Personal Block",
            classNo: "CUSTOM",
            day: "Tuesday",
            startTime: "1000",
            endTime: "1200",
            venue: "",
            weeks: [1],
            startMins: 600,
            endMins: 720,
            weekBitmask: 1,
        };

        renderDialog(vi.fn(), {
            open: true,
            editLesson,
            onUpdateCustomEvent,
        });

        fireEvent.click(
            screen.getByRole("button", {
                name: "Update Schedule",
            })
        );

        await waitFor(() => {
            expect(onUpdateCustomEvent).toHaveBeenCalled();
        });

        expect(onUpdateCustomEvent).toHaveBeenCalledWith("abc", expect.any(Object));
    });
});
