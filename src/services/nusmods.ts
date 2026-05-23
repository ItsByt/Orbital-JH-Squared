export interface ModuleSummary {
    moduleCode: string;
    title: string;
    semesters: number[];
}


export interface ModuleDetails {
    moduleCode: string
    title: string
    moduleCredit: string 
}

export async function getModuleList(acadYear = "2025-2026"): Promise<ModuleSummary[]> {
    try {
        const response = await fetch(`https://api.nusmods.com/v2/${acadYear}/moduleList.json`)

        if (!response.ok) return [];

        return await response.json();
    } catch (error) {
        console.error("Failed to fetch module list", error);
        return [];
    }
}

export async function getModule(moduleCode: string): Promise<ModuleDetails | null> {
    try {
        const response = await fetch(`https://api.nusmods.com/v2/2025-2026/modules/${moduleCode.toUpperCase()}.json`)
        
        if (!response.ok) return null;

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch module", error);
        return null;
    }
}