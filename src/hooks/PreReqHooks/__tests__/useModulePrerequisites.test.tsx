import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useModulePrerequisites } from "../useModulePrerequisites";
import * as nusmodsService from "@/services/nusmods";
import * as treeFormatter from "@/utils/prereqUtils/treeFormatter";

// Mock external services and utils
vi.mock("@/services/nusmods");
vi.mock("@/utils/prereqUtils/treeFormatter");


// Helper to create a clean React Query provider for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Turn off retries for faster error testing
      },
    },
  });

const createWrapper = () => {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useModulePrerequisites Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null formatted_tree and false states when selectedModule is null", async () => {
    vi.mocked(nusmodsService.getModuleCodes).mockResolvedValue(["CS1010", "CS2030S"]);

    const { result } = renderHook(() => useModulePrerequisites(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.formatted_tree).toBeNull();
    expect(result.current.hasNoPrereqs).toBe(false);
  });

  it("should successfully fetch module details and format the tree", async () => {
    const mockModuleCodes = ["CS1010", "CS2030S", "CS2040S"];
    const mockModuleDetails = {
      moduleCode: "CS2040S",
      prereqTree: "CS1010",
    };
    const mockFormattedTree = { type: "leaf", moduleCode: "CS1010" };

    vi.mocked(nusmodsService.getModuleCodes).mockResolvedValue(mockModuleCodes);
    vi.mocked(nusmodsService.getModule).mockResolvedValue(mockModuleDetails as unknown as Awaited<ReturnType<typeof nusmodsService.getModule>>);
    vi.mocked(treeFormatter.formatTree).mockReturnValue(mockFormattedTree as unknown as ReturnType<typeof treeFormatter.formatTree>);

    const { result } = renderHook(() => useModulePrerequisites("CS2040S"), {
      wrapper: createWrapper(),
    });

    // Wait for queries to resolve
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.formatted_tree).toEqual(mockFormattedTree);
    expect(result.current.hasNoPrereqs).toBe(false);
    expect(treeFormatter.formatTree).toHaveBeenCalledWith("CS1010", mockModuleCodes);
  });

  it("should flag hasNoPrereqs as true when API returns no prereqTree property", async () => {
    vi.mocked(nusmodsService.getModuleCodes).mockResolvedValue(["CS1010"]);
    vi.mocked(nusmodsService.getModule).mockResolvedValue({ moduleCode: "CS1010" } as unknown as Awaited<ReturnType<typeof nusmodsService.getModule>>); // no prereqTree

    const { result } = renderHook(() => useModulePrerequisites("CS1010"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasNoPrereqs).toBe(true);
    expect(result.current.formatted_tree).toBeNull();
  });
});