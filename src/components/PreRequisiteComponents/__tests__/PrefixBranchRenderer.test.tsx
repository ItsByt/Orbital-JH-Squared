import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PrefixBranchRenderer from "../NodeRenderers/PrefixBranchRenderer";

interface MockPrefixChildProps {
  node: {
    moduleCode?: string;
  };
  disableExpansion?: boolean;
}

vi.mock("../PreReqTree", () => ({
  default: ({ node, disableExpansion }: MockPrefixChildProps) => (
    <div data-testid="prefix-child">
      {node.moduleCode} (disabled: {String(disableExpansion)})
    </div>
  ),
}));

describe("PrefixBranchRenderer Component", () => {
  const mockNode = {
    type: "prefix-branch" as const,
    prefixLabel: "Courses beginning with CS2",
    allPossibleMatches: ["CS2030S", "CS2040S"],
  };

  it("should render collapsed by default with correct match count", () => {
    render(<PrefixBranchRenderer node={mockNode} />);
    expect(screen.getByText("Courses beginning with CS2")).toBeInTheDocument();
    expect(screen.getByText("(2) ▼")).toBeInTheDocument();
    expect(screen.queryByTestId("prefix-child")).not.toBeInTheDocument();
  });

  it("should render all matching modules with expansion disabled when clicked", () => {
    render(<PrefixBranchRenderer node={mockNode} />);
    
    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("(2) ▲")).toBeInTheDocument();
    const children = screen.getAllByTestId("prefix-child");
    expect(children).toHaveLength(2);
    expect(children[0]).toHaveTextContent("CS2030S (disabled: true)");
    expect(children[1]).toHaveTextContent("CS2040S (disabled: true)");
  });
});