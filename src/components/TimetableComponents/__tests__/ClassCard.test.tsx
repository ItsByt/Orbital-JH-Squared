import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ClassCard from "../ClassCard";
import type { DisplayLesson } from "@/types";
import { useSettingsStore } from "@/store/useSettingsStore";

vi.mock("next-themes", () => ({
    useTheme: () => ({
        theme: "dark",
        systemTheme: "dark",
    }),
}));

const baseLesson: DisplayLesson = {
    id: "1",
    moduleCode: "CS1010",
    lessonType: "Lecture",
    classNo: "01",
    day: "Monday",
    startTime: "1000",
    endTime: "1200",
    venue: "LT1",
    weeks: [1, 2, 3],
    startMins: 600,
    endMins: 720,
    weekBitmask: 7,
    color: "#56A58B",
};

function renderCard(
    lesson: DisplayLesson = baseLesson,
    allVisibleLessons: DisplayLesson[] = [baseLesson]
) {
    const onSelectClass = vi.fn();
    const onSwapClass = vi.fn();
    const onUpdateCustomLesson = vi.fn();

    render(
        <ClassCard
            lesson={lesson}
            allVisibleLessons={allVisibleLessons}
            colStart={1}
            colEnd={2}
            rowIndex={1}
            selectedLesson={null}
            onSelectClass={onSelectClass}
            onSwapClass={onSwapClass}
            onUpdateCustomLesson={onUpdateCustomLesson}
        />
    );

    return {
        onSelectClass,
        onSwapClass,
        onUpdateCustomLesson,
    };
}

describe("ClassCard", () => {
    beforeEach(() => {
        useSettingsStore.setState({
            startHour: 8,
            endHour: 22,
            cardFontSize: "regular",
            cardFontFamily: "sans",
            isSyncing: false,
        });
    });

    it("renders lesson details", () => {
        renderCard();

        expect(screen.getByText("CS1010")).toBeInTheDocument();
        expect(screen.getByText(/Lecture/)).toBeInTheDocument();
        expect(screen.getByText("LT1")).toBeInTheDocument();
    });

    it("calls onSelectClass for normal lessons", () => {
        const { onSelectClass } = renderCard();

        fireEvent.click(screen.getByText("CS1010"));

        expect(onSelectClass).toHaveBeenCalledTimes(1);
        expect(onSelectClass).toHaveBeenCalledWith(baseLesson);
    });

    it("calls onSwapClass for alternative lessons", () => {
        const alternativeLesson: DisplayLesson = {
            ...baseLesson,
            id: "alt-1",
            classNo: "02",
            isAlternative: true,
        };

        const { onSwapClass } = renderCard(alternativeLesson);

        fireEvent.click(screen.getByText("CS1010"));

        expect(onSwapClass).toHaveBeenCalledTimes(1);
        expect(onSwapClass).toHaveBeenCalledWith(null, alternativeLesson);
    });

    it("calls onUpdateCustomLesson for personal blocks", () => {
        const customLesson: DisplayLesson = {
            ...baseLesson,
            id: "custom-1",
            moduleCode: "Study",
            lessonType: "Personal Block",
            classNo: "CUSTOM123",
        };

        const { onUpdateCustomLesson } = renderCard(customLesson);

        fireEvent.click(screen.getByText("Study"));

        expect(onUpdateCustomLesson).toHaveBeenCalledTimes(1);
        expect(onUpdateCustomLesson).toHaveBeenCalledWith(customLesson);
    });

    it("shows clash warning when another lesson overlaps", () => {
        const conflictingLesson: DisplayLesson = {
            ...baseLesson,
            id: "2",
            moduleCode: "CS2040",
            startTime: "1100",
            endTime: "1300",
            startMins: 660,
            endMins: 780,
        };

        renderCard(baseLesson, [baseLesson, conflictingLesson]);

        const card = screen.getByTitle("TIMETABLE CLASH: Overlaps with CS2040 (Lecture)");

        expect(card).toBeInTheDocument();
        expect(screen.getByText("⚠️")).toBeInTheDocument();
    });

    it("does not show clash warning for alternative lessons", () => {
        const alternativeLesson: DisplayLesson = {
            ...baseLesson,
            isAlternative: true,
        };

        renderCard(alternativeLesson, [
            alternativeLesson,
            {
                ...baseLesson,
                id: "2",
                moduleCode: "CS2040",
                startMins: 650,
                endMins: 750,
            },
        ]);

        expect(screen.queryByText("⚠️")).not.toBeInTheDocument();
    });

    it("uses selected font settings from store", () => {
        useSettingsStore.setState({
            cardFontSize: "large",
            cardFontFamily: "mono",
        });

        const { container } = render(
            <ClassCard
                lesson={baseLesson}
                allVisibleLessons={[baseLesson]}
                colStart={1}
                colEnd={2}
                rowIndex={1}
                selectedLesson={null}
                onSelectClass={vi.fn()}
                onSwapClass={vi.fn()}
                onUpdateCustomLesson={vi.fn()}
            />
        );

        const card = container.firstChild;

        expect(card).toHaveClass("text-base");
        expect(card).toHaveClass("font-mono");
    });
});
