import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ActiveContainer from "../ActiveContainer";
import type { DisplayLesson } from "@/types";

vi.mock("@/components/GeneralComponents/SearchBar", () => ({
    default: ({ onSelect }: { onSelect: (moduleCode: string) => void }) => (
        <button onClick={() => onSelect("CS1010")}>Mock Search Result</button>
    ),
}));

const createLesson = (overrides: Partial<DisplayLesson> = {}): DisplayLesson => ({
    id: "1",
    moduleCode: "CS1010",
    lessonType: "LEC",
    classNo: "1",
    day: "Monday",
    startTime: "1000",
    endTime: "1200",
    venue: "LT1",
    weeks: [1, 2],
    startMins: 600,
    endMins: 720,
    weekBitmask: 3,
    color: "#56A58B",
    ...overrides,
});

describe("ActiveContainer", () => {
    const defaultProps = {
        uniqueActiveModules: [createLesson()],
        customNameCounts: {},
        handleAddModule: vi.fn().mockResolvedValue(undefined),
        handleRemoveModule: vi.fn(),
        handleUpdateColor: vi.fn(),
        semester: 1,
    };

    it("renders active modules and module count", () => {
        render(<ActiveContainer {...defaultProps} />);

        expect(screen.getByText("Active Modules (1)")).toBeInTheDocument();

        expect(screen.getByText("CS1010")).toBeInTheDocument();
    });

    it("does not render active section when there are no modules", () => {
        render(<ActiveContainer {...defaultProps} uniqueActiveModules={[]} />);

        expect(screen.queryByText(/Active Modules/)).not.toBeInTheDocument();
    });

    it("calls handleAddModule when SearchBar selects a module", async () => {
        const handleAddModule = vi.fn().mockResolvedValue(undefined);

        render(<ActiveContainer {...defaultProps} handleAddModule={handleAddModule} />);

        await userEvent.click(screen.getByText("Mock Search Result"));

        expect(handleAddModule).toHaveBeenCalledWith("CS1010", defaultProps.uniqueActiveModules);
    });

    it("shows duplicate personal block information", () => {
        const customBlock = createLesson({
            moduleCode: "Gym",
            lessonType: "Personal Block",
            day: "Monday",
            startTime: "0900",
            endTime: "1000",
            weeks: [1, 2],
        });

        render(
            <ActiveContainer
                {...defaultProps}
                uniqueActiveModules={[customBlock]}
                customNameCounts={{
                    GYM: 2,
                }}
            />
        );

        expect(screen.getByText("Mon")).toBeInTheDocument();

        expect(screen.getByText("0900-1000")).toBeInTheDocument();
    });

    it("opens module options menu", async () => {
        render(<ActiveContainer {...defaultProps} />);

        const optionsButton = screen.getByRole("button", {
            name: "Options for CS1010",
        });

        await userEvent.click(optionsButton);

        expect(screen.getByText("Remove Module")).toBeInTheDocument();
    });

    it("calls handleRemoveModule when removing a module", async () => {
        const handleRemoveModule = vi.fn();

        render(<ActiveContainer {...defaultProps} handleRemoveModule={handleRemoveModule} />);

        await userEvent.click(
            screen.getByRole("button", {
                name: "Options for CS1010",
            })
        );

        await userEvent.click(screen.getByText("Remove Module"));

        expect(handleRemoveModule).toHaveBeenCalledWith("CS1010", "1", "LEC");
    });

    it("calls handleUpdateColor when selecting a preset color", async () => {
        const handleUpdateColor = vi.fn();

        render(<ActiveContainer {...defaultProps} handleUpdateColor={handleUpdateColor} />);

        await userEvent.click(
            screen.getByRole("button", {
                name: "Options for CS1010",
            })
        );

        await userEvent.click(
            screen.getByRole("button", {
                name: "Set color to #56A58B",
            })
        );

        expect(handleUpdateColor).toHaveBeenCalledWith("CS1010", "#56A58B", "1", "LEC");
    });

    it("passes semester to SearchBar", () => {
        render(<ActiveContainer {...defaultProps} semester={2} />);

        expect(screen.getByText("Mock Search Result")).toBeInTheDocument();
    });
});
