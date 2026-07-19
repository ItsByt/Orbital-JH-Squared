import { describe, it, expect } from "vitest";
import { formatTree } from "../treeFormatter";
import type { PrereqTree } from "@/types";

const MOCK_VALID_CODES = ["CS1010", "CS1010S", "CS2030S", "CS2040S", "MA1521"];

describe("formatTree", () => {
  it("should return an empty leaf node when input is null or undefined", () => {
    expect(formatTree(null as unknown as PrereqTree, MOCK_VALID_CODES)).toEqual({
      type: "leaf",
      moduleCode: "",
    });
  });

  it("should delegate string inputs to parseStringRule", () => {
    const result = formatTree("CS2030S", MOCK_VALID_CODES);
    expect(result).toEqual({ type: "leaf", moduleCode: "CS2030S" });
  });

  it("should format cohort requirement nodes correctly", () => {
    // Cast as unknown as PrereqTree to bypass strict checking 
    const input = {
      cohort: {
        years: ["S:2021", "E:2023", "2024"],
      },
    } as unknown as PrereqTree;

    const result = formatTree(input, MOCK_VALID_CODES);
    expect(result).toEqual({
      type: "branch",
      label: "Cohorts starting from 2021, up till 2023, 2024",
    });
  });

  it("should format 'nOf' requirements with exact modules and wildcard prefixes", () => {
    const input: PrereqTree = {
      nOf: [2, ["CS1010", "CS2%"]],
    };

    const result = formatTree(input, MOCK_VALID_CODES);

    expect(result.type).toBe("branch");
    expect(result.label).toBe("needs at least 2 of");
    expect(result.or).toHaveLength(2);
    expect(result.or![0]).toEqual({ type: "leaf", moduleCode: "CS1010" });
    expect(result.or![1].type).toBe("prefix-branch");
  });

  it("should recursively format 'and' and 'or' logical operators", () => {
    const input: PrereqTree = {
      and: [
        "CS1010",
        { or: ["MA1521", "MA2001"] },
      ],
    };

    const result = formatTree(input, MOCK_VALID_CODES);

    expect(result.type).toBe("branch");
    expect(result.and).toHaveLength(2);
    expect(result.and![0]).toEqual({ type: "leaf", moduleCode: "CS1010" });
    expect(result.and![1].type).toBe("branch");
    expect(result.and![1].or).toHaveLength(2);
  });

  it("should retain custom UI labels if present on object nodes", () => {
    const input: PrereqTree = {
      label: "Custom Advisory Requirement",
      or: ["CS1010", "CS1010S"],
    } as unknown as PrereqTree;

    const result = formatTree(input, MOCK_VALID_CODES);
    expect(result.label).toBe("Custom Advisory Requirement");
  });
});