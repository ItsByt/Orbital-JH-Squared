import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LeafRenderer from "../NodeRenderers/LeafRenderer";
import * as preReqHooks from "@/hooks/PreReqHooks/useModulePrerequisites";

vi.mock("@/hooks/PreReqHooks/useModulePrerequisites");

interface MockTreeProps {
  node: {
    moduleCode?: string;
  };
}

// Mock PreReqTree to prevent infinite recursion during tests
vi.mock("../PreReqTree", () => ({
  default: ({ node }: MockTreeProps) => <div data-testid="subtree">{node.moduleCode}</div>,
}));

// Helper type to cleanly cast hook return values
type HookReturn = ReturnType<typeof preReqHooks.useModulePrerequisites>;

describe("LeafRenderer Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render standard module codes cleanly without grades", () => {
    vi.mocked(preReqHooks.useModulePrerequisites).mockReturnValue({
      formatted_tree: null,
      isLoading: false,
      hasNoPrereqs: true,
    } as unknown as HookReturn);

    render(<LeafRenderer node={{ type: "leaf", moduleCode: "CS2030S:D" }} />);
    expect(screen.getByRole("button")).toHaveTextContent("CS2030S"); // 'D' grade is hidden by default
  });

  it("should format and display special grade requirements", () => {
    vi.mocked(preReqHooks.useModulePrerequisites).mockReturnValue({
      formatted_tree: null,
      isLoading: false,
      hasNoPrereqs: true,
    } as unknown as HookReturn);

    render(<LeafRenderer node={{ type: "leaf", moduleCode: "CS1010:B+" }} />);
    expect(screen.getByRole("button")).toHaveTextContent("Minimally B+ for CS1010");
  });

  it("should toggle expansion on click and trigger onToggleExpand callback", () => {
    const handleToggle = vi.fn();
    vi.mocked(preReqHooks.useModulePrerequisites).mockReturnValue({
      formatted_tree: null,
      isLoading: true,
      hasNoPrereqs: false,
    } as unknown as HookReturn);

    render(<LeafRenderer node={{ type: "leaf", moduleCode: "CS2040S" }} onToggleExpand={handleToggle} />);
    
    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(handleToggle).toHaveBeenCalledWith(true);
    expect(screen.getByText("Loading prerequisites...")).toBeInTheDocument();
  });

  it("should not expand or trigger callbacks when disableExpansion is true", () => {
    const handleToggle = vi.fn();
    render(<LeafRenderer node={{ type: "leaf", moduleCode: "CS2040S" }} onToggleExpand={handleToggle} disableExpansion={true} />);
    
    fireEvent.click(screen.getByRole("button"));
    expect(handleToggle).not.toHaveBeenCalled();
    expect(screen.queryByText("Loading prerequisites...")).not.toBeInTheDocument();
  });

  it("should display 'This module no longer exists' for dead modules without subtrees", () => {
    vi.mocked(preReqHooks.useModulePrerequisites).mockReturnValue({
      formatted_tree: null,
      isLoading: false,
      hasNoPrereqs: false, // not loading, not empty, but tree is null -> dead
    } as unknown as HookReturn);

    render(<LeafRenderer node={{ type: "leaf", moduleCode: "DEAD1000" }} />);
    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("This module no longer exists")).toBeInTheDocument();
  });
});