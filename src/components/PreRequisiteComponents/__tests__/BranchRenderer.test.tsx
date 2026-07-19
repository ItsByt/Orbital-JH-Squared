import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BranchRenderer from "../NodeRenderers/BranchRenderer";

interface MockChildProps {
  node: {
    moduleCode?: string;
    label?: string;
  };
  onToggleExpand?: (expanded: boolean) => void;
}

// Mock child component to simulate user clicking a child inside a branch
vi.mock("../PreReqTree", () => ({
  default: ({ node, onToggleExpand }: MockChildProps) => (
    <div data-testid="child-node">
      <span>{node.moduleCode || node.label}</span>
      <button onClick={() => onToggleExpand?.(true)}>Expand Child</button>
    </div>
  ),
}));

describe("BranchRenderer Component", () => {
  it("should render 'needs all of' by default for AND branches", () => {
    const node = {
      type: "branch" as const,
      and: [{ type: "leaf" as const, moduleCode: "CS1010" }],
    };
    render(<BranchRenderer node={node} />);
    expect(screen.getByText("needs all of")).toBeInTheDocument();
  });

  it("should render 'needs any of' for OR branches", () => {
    const node = {
      type: "branch" as const,
      or: [{ type: "leaf" as const, moduleCode: "CS1010" }],
    };
    render(<BranchRenderer node={node} />);
    expect(screen.getByText("needs any of")).toBeInTheDocument();
  });

  it("should hide unselected sibling nodes when an OR branch child is expanded", () => {
    const node = {
      type: "branch" as const,
      or: [
        { type: "leaf" as const, moduleCode: "CS1010" },
        { type: "leaf" as const, moduleCode: "CS1010S" },
      ],
    };

    render(<BranchRenderer node={node} />);
    
    // Initially both children should be rendered
    expect(screen.getAllByTestId("child-node")).toHaveLength(2);

    // Expand the first child (CS1010)
    const expandButtons = screen.getAllByText("Expand Child");
    fireEvent.click(expandButtons[0]);

    // After expanding in an OR branch, only the active child should remain
    const remainingChildren = screen.getAllByTestId("child-node");
    expect(remainingChildren).toHaveLength(1);
    expect(remainingChildren[0]).toHaveTextContent("CS1010");
    expect(screen.queryByText("CS1010S")).not.toBeInTheDocument();
  });
});