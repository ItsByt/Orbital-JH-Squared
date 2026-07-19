import { describe, it, expect } from "vitest";
import { createPrefixBranch, parseStringRule } from "../prefix&Parse";

// Mock module database for testing prefix matching
const MOCK_VALID_CODES = [
  "CS1010", "CS1010S", "CS2030S", "CS2040S", "CS2100", 
  "MA1521", "MA2001", "ST2334"
];

describe("Prefix & Parse Utils", () => {
  describe("createPrefixBranch", () => {
    it("should clean prefix symbols and filter matching codes alphabetically", () => {
      const result = createPrefixBranch("CS2%: CS2000 level courses", MOCK_VALID_CODES);

      expect(result).toEqual({
        type: "prefix-branch",
        prefixLabel: "Courses beginning with CS2",
        or: [],
        allPossibleMatches: ["CS2030S", "CS2040S", "CS2100"],
      });
    });

    it("should return an empty matches array if no valid codes match the prefix", () => {
      const result = createPrefixBranch("IS1%", MOCK_VALID_CODES);
      expect(result.allPossibleMatches).toEqual([]);
    });
  });

  describe("parseStringRule", () => {
    it("should parse an exact module code into a leaf node", () => {
      const result = parseStringRule("CS2030S", MOCK_VALID_CODES);
      expect(result).toEqual({
        type: "leaf",
        moduleCode: "CS2030S",
      });
    });

    it("should parse a module code with a trailing description into a leaf node", () => {
      const result = parseStringRule("CS2040S: Data Structures and Algorithms", MOCK_VALID_CODES);
      expect(result).toEqual({
        type: "leaf",
        moduleCode: "CS2040S: Data Structures and Algorithms",
      });
    });

    it("should parse wildcard string rules with COURSES(n) requirement", () => {
      const rule = "COURSES(2) from CS2% or MA2%";
      const result = parseStringRule(rule, MOCK_VALID_CODES);

      expect(result.type).toBe("branch");
      expect(result.label).toBe("needs at least 2 modules from");
      expect(result.or).toHaveLength(2);
      const firstBranch = result.or![0] as { allPossibleMatches?: string[] };
      expect(firstBranch.allPossibleMatches).toEqual(["CS2030S", "CS2040S", "CS2100"]);
    });

    it("should parse wildcard string rules with 'at least n' requirement", () => {
      const rule = "at least 1 of MA1% or ST2%";
      const result = parseStringRule(rule, MOCK_VALID_CODES);

      expect(result.type).toBe("branch");
      expect(result.label).toBe("needs at least 1 modules from");
      expect(result.or).toHaveLength(2);
    });

    it("should return a generic branch for rule-based text strings without module codes", () => {
      const rule = "Must be a student from the School of Computing";
      const result = parseStringRule(rule, MOCK_VALID_CODES);

      expect(result).toEqual({
        type: "branch",
        label: "Must be a student from the School of Computing",
      });
    });
  });
});