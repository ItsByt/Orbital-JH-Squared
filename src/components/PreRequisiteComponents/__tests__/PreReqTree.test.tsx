import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PreReqTree from "../PreReqTree";

interface MockNodeProps {
    node: {
        type?: string;
        moduleCode?: string;
        label?: string;
        prefixLabel?: string;
    };
}

vi.mock("@/components/PreRequisiteComponents/NodeRenderers/LeafRenderer", () => ({
    default: ({ node }: MockNodeProps) => <div data-testid="leaf-renderer">{node.moduleCode}</div>,
}));

vi.mock("@/components/PreRequisiteComponents/NodeRenderers/BranchRenderer", () => ({
    default: ({ node }: MockNodeProps) => <div data-testid="branch-renderer">{node.label}</div>,
}));

vi.mock("@/components/PreRequisiteComponents/NodeRenderers/PrefixBranchRenderer", () => ({
    default: ({ node }: MockNodeProps) => (
        <div data-testid="prefix-renderer">{node.prefixLabel}</div>
    ),
}));

describe("PreReqTree Component", () => {
    it("should render LeafRenderer inside root container when isRoot is true and type is leaf", () => {
        render(<PreReqTree node={{ type: "leaf", moduleCode: "CS2030S" }} isRoot={true} />);
        expect(screen.getByTestId("leaf-renderer")).toHaveTextContent("CS2030S");
    });

    it("should render BranchRenderer inside root container when isRoot is true and type is branch", () => {
        render(<PreReqTree node={{ type: "branch", label: "needs all of" }} isRoot={true} />);
        expect(screen.getByTestId("branch-renderer")).toHaveTextContent("needs all of");
    });

    it("should delegate to PrefixBranchRenderer directly when isRoot is false and type is prefix-branch", () => {
        render(
            <PreReqTree
                node={{ type: "prefix-branch", prefixLabel: "Courses beginning with CS2" }}
                isRoot={false}
            />
        );
        expect(screen.getByTestId("prefix-renderer")).toHaveTextContent(
            "Courses beginning with CS2"
        );
    });
});
