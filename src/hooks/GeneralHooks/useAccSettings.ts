import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/services/supabase";
import { getErrorMessage } from "@/utils/generalUtils/getErrorMessage";
import { toast } from "sonner";
import { usePlannerStore } from "@/store/usePlannerStore";
import { useSettingsStore } from "@/store/useSettingsStore";

export function useLogout() {
    const queryClient = useQueryClient();
    const resetSettings = useSettingsStore((state) => state.resetSettings);

    async function logout() {
        const { error: signOutError } = await supabase.auth.signOut();

        if (signOutError) {
            toast.error("Log Out Failed", { description: getErrorMessage(signOutError) });
            return;
        }

        queryClient.clear();
        usePlannerStore.getState().resetStore();
        resetSettings();
        toast.success("Logged Out Successfully!");
    }

    return { logout };
}
