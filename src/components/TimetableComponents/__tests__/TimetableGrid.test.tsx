import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TimetableGrid from "../TimetableGrid";
import type { DisplayLesson } from "@/types";

interface MockClassCardProps {
    lesson: DisplayLesson;
    onSelectClass: (lesson: DisplayLesson) => void;
    onSwapClass: (
        selected: DisplayLesson | null,
        target: DisplayLesson
    ) => void;
    onUpdateCustomLesson: (lesson: DisplayLesson) => void;
}

vi.mock("../ClassCard", () => ({
    default: ({
        lesson,
        onSelectClass,
        onSwapClass,
        onUpdateCustomLesson,
    }: MockClassCardProps) => (
        <div data-testid={`class-${lesson.id}`}>
            <span>{lesson.moduleCode}</span>

            <button
                onClick={() => onSelectClass(lesson)}
            >
                Select
            </button>

            <button
                onClick={() =>
                    onSwapClass(null, lesson)
                }
            >
                Swap
            </button>

            <button
                onClick={() =>
                    onUpdateCustomLesson(lesson)
                }
            >
                Update
            </button>
        </div>
    ),
}));

vi.mock("@/utils/timetableUtils/subrowAllocation", () => ({
    calculateDayLayout: vi.fn(() => ({
        totalRowsForDay: 1,
        lessonRowMap: new Map([
            ["1", 0],
        ]),
    })),
}));

describe("TimetableGrid", () => {
    const DAYS = [
        "Monday",
        "Tuesday",
        "Wednesday",
    ];

    const HOURS = [
        "0900",
        "1000",
        "1100",
        "1200",
    ];

    const lesson: DisplayLesson = {
        id: "1",
        moduleCode: "CS1010",
        lessonType: "Lecture",
        classNo: "1",
        day: "Monday",
        startTime: "0900",
        endTime: "1100",
        venue: "LT1",
        weeks: [1],
        startMins: 540,
        endMins: 660,
        weekBitmask: 1,
    };


    function renderGrid(
        props: Partial<{
            lessonsByDay: Record<string, DisplayLesson[]>;
            selectedLesson: DisplayLesson | null;
            handleSelectClass: (lesson: DisplayLesson) => void;
            handleSwapClass: (
                selected: DisplayLesson | null,
                target: DisplayLesson
            ) => void;
            handleUpdateCustomLesson: (
                lesson: DisplayLesson
            ) => void;
            captureMode: boolean;
        }> = {}
    ) {
        return render(
            <TimetableGrid
                DAYS={DAYS}
                HOURS={HOURS}
                lessonsByDay={{
                    Monday: [lesson],
                    Tuesday: [],
                    Wednesday: [],
                }}
                selectedLesson={null}
                handleSelectClass={vi.fn()}
                handleSwapClass={vi.fn()}
                handleUpdateCustomLesson={vi.fn()}
                {...props}
            />
        );
    }


    beforeEach(() => {
        vi.clearAllMocks();
    });


    it("renders all day labels", () => {
        renderGrid();

        expect(
            screen.getByText("Mon")
        ).toBeInTheDocument();

        expect(
            screen.getByText("Tue")
        ).toBeInTheDocument();

        expect(
            screen.getByText("Wed")
        ).toBeInTheDocument();
    });


    it("renders hour headers", () => {
        renderGrid();

        HOURS.forEach((hour) => {
            expect(
                screen.getByText(hour)
            ).toBeInTheDocument();
        });
    });


    it("renders lessons inside timetable", () => {
        renderGrid();

        expect(
            screen.getByTestId("class-1")
        ).toBeInTheDocument();

        expect(
            screen.getByText("CS1010")
        ).toBeInTheDocument();
    });


    it("filters lessons outside timetable range", () => {
        const outsideLesson: DisplayLesson = {
            ...lesson,
            id: "outside",
            startTime: "1300",
            endTime: "1400",
        };

        renderGrid({
            lessonsByDay: {
                Monday: [
                    lesson,
                    outsideLesson,
                ],
                Tuesday: [],
                Wednesday: [],
            },
        });


        expect(
            screen.getByTestId("class-1")
        ).toBeInTheDocument();


        expect(
            screen.queryByTestId("class-outside")
        ).not.toBeInTheDocument();
    });


    it("calls select callback when class is selected", () => {
        const handleSelectClass = vi.fn();

        renderGrid({
            handleSelectClass,
        });


        fireEvent.click(
            screen.getByRole("button", {
                name: "Select",
            })
        );


        expect(
            handleSelectClass
        ).toHaveBeenCalledWith(lesson);
    });


    it("calls swap callback when swap is clicked", () => {
        const handleSwapClass = vi.fn();

        renderGrid({
            handleSwapClass,
        });


        fireEvent.click(
            screen.getByRole("button", {
                name: "Swap",
            })
        );


        expect(
            handleSwapClass
        ).toHaveBeenCalledWith(
            null,
            lesson
        );
    });


    it("calls update callback when update is clicked", () => {
        const handleUpdateCustomLesson = vi.fn();

        renderGrid({
            handleUpdateCustomLesson,
        });


        fireEvent.click(
            screen.getByRole("button", {
                name: "Update",
            })
        );


        expect(
            handleUpdateCustomLesson
        ).toHaveBeenCalledWith(lesson);
    });


    it("supports capture mode", () => {
        const { container } = renderGrid({
            captureMode: true,
        });


        const wrapper =
            container.firstChild as HTMLElement;


        expect(
            wrapper.className
        ).toContain(
            "overflow-visible"
        );
    });


    it("renders selected lesson correctly", () => {
        renderGrid({
            selectedLesson: lesson,
        });


        expect(
            screen.getByTestId("class-1")
        ).toBeInTheDocument();
    });
});