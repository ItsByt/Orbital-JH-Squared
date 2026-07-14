import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/services/supabase";
import { useSettingsStore } from "@/store/useSettingsStore";

// Loads user selected settings for the timetable page
export function useTimetableSettings() {
    const { startHour, endHour, hydrateSettings } = useSettingsStore();
    const [hasHydrated, setHasHydrated] = useState(false);

    useEffect(() => {
        if (hasHydrated) return;

        async function loadUserSettings() {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("accessibilities")
                .select("start_hour, end_hour, card_font_size, card_font_family")
                .eq("id", user.id);

            if (error) {
                console.error("Fetch error:", error);
                return;
            }

            if (data && data.length > 0) {
                const settings = data[0];
                hydrateSettings({
                    startHour: settings.start_hour,
                    endHour: settings.end_hour,
                    cardFontSize: settings.card_font_size,
                    cardFontFamily: settings.card_font_family,
                });
            }
            setHasHydrated(true);
        }

        loadUserSettings();
    }, [hydrateSettings, hasHydrated]);

    // Memoize the hours array so it only recalculates when start/end hours change
    const dynamicHours = useMemo(() => {
        const hours: string[] = [];
        for (let i = startHour; i <= endHour; i++) {
            hours.push(`${i.toString().padStart(2, "0")}00`);
        }
        return hours;
    }, [startHour, endHour]);

    return { dynamicHours };
}