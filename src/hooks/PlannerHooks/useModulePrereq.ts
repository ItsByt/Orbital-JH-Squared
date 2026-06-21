import { useEffect } from "react";
import { usePlannerStore } from "@/store/usePlannerStore";
import { getModule } from "@/services/nusmods";
import { getErrorMessage } from "@/utils/generalUtils/getErrorMessage";

export function useModulePrereq(moduleCode: string) {
    const cache = usePlannerStore((state) => state.prereqCache[moduleCode]);
    const setCache = usePlannerStore((state) => state.setPrereqCache);

    useEffect(() => {
        // If it's already in the store, no need to re-get the data
        if (cache !== undefined) return;

        // Protecting against React StrictMode unmounting for components
        let isMounted = true;

        const fetchPrereq = async () => {
            try {
                const data = await getModule(moduleCode);
                if (isMounted) setCache(moduleCode, data?.prereqTree || null);
            } catch (error) {
                console.error(getErrorMessage(error));
                if (isMounted) setCache(moduleCode, null);
            }
        };

        fetchPrereq();

        return () => {
            isMounted = false;
        };
    }, [moduleCode, cache, setCache]);

    return cache;
}
