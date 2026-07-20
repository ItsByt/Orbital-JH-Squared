import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SemesterNavigation from "../SemesterNavigation";
import { MemoryRouter } from "react-router-dom";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");

    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe("SemesterNavigation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    function renderComponent(semester: number) {
        return render(
            <MemoryRouter>
                <SemesterNavigation semester={semester} />
            </MemoryRouter>
        );
    }

    it("renders both semester buttons", () => {
        renderComponent(1);

        expect(
            screen.getByRole("button", {
                name: "Semester 1",
            })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", {
                name: "Semester 2",
            })
        ).toBeInTheDocument();
    });


    it("navigates to semester 1 timetable when Semester 1 is clicked", () => {
        renderComponent(2);

        fireEvent.click(
            screen.getByRole("button", {
                name: "Semester 1",
            })
        );

        expect(mockNavigate).toHaveBeenCalledWith(
            "/timetable/sem-1"
        );
    });


    it("navigates to semester 2 timetable when Semester 2 is clicked", () => {
        renderComponent(1);

        fireEvent.click(
            screen.getByRole("button", {
                name: "Semester 2",
            })
        );

        expect(mockNavigate).toHaveBeenCalledWith(
            "/timetable/sem-2"
        );
    });


    it("highlights Semester 1 when semester is 1", () => {
        renderComponent(1);

        const sem1Button = screen.getByRole("button", {
            name: "Semester 1",
        });

        const sem2Button = screen.getByRole("button", {
            name: "Semester 2",
        });

        expect(sem1Button.className).toContain(
            "bg-[#749c83]"
        );

        expect(sem2Button.className).toContain(
            "border-border"
        );
    });


    it("highlights Semester 2 when semester is 2", () => {
        renderComponent(2);

        const sem1Button = screen.getByRole("button", {
            name: "Semester 1",
        });

        const sem2Button = screen.getByRole("button", {
            name: "Semester 2",
        });

        expect(sem2Button.className).toContain(
            "bg-[#749c83]"
        );

        expect(sem1Button.className).toContain(
            "border-border"
        );
    });
});